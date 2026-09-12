#!/usr/bin/env python3
"""
Forge Simulation Integration Module.
Import this in your main forge loop to enable automatic simulation triggers.
Usage:
    from forge_simulation_integration import ForgeLoopIntegrator, ForgeLoopConfig
    
    integrator = ForgeLoopIntegrator(ForgeLoopConfig())
    integrator.run_pre_swarm()
    for iteration in range(max_iterations):
        integrator.run_pre_iteration(iteration)
        # ... your swarm iteration ...
        integrator.run_post_iteration(iteration)
    integrator.run_post_swarm()
"""
import sys
import time
import importlib.util
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from enum import Enum

class SimulationPhase(Enum):
    PRE_SWARM = "pre_swarm"
    POST_SWARM = "post_swarm"
    PRE_ITERATION = "pre_iteration"
    POST_ITERATION = "post_iteration"

@dataclass
class SimulationResult:
    phase: SimulationPhase
    success: bool
    output: Any = None
    error: Optional[str] = None
    duration_ms: float = 0.0
    timestamp: float = field(default_factory=time.time)

@dataclass
class ForgeLoopConfig:
    simulate_organ_path: str = "organs/simulate.py"
    enable_pre_swarm: bool = True
    enable_post_swarm: bool = True
    enable_pre_iteration: bool = False
    enable_post_iteration: bool = True
    max_simulation_time_ms: int = 5000
    fallback_on_error: bool = True

class SimulateOrganWrapper:
    def __init__(self, organ_path: Path):
        self.organ_path = organ_path
        self.module = None
        self.simulate_class = None
        self._load_organ()
    
    def _load_organ(self) -> bool:
        try:
            spec = importlib.util.spec_from_file_location("simulate", self.organ_path)
            if spec and spec.loader:
                self.module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(self.module)
                for name in dir(self.module):
                    obj = getattr(self.module, name)
                    if isinstance(obj, type) and 'simulat' in name.lower():
                        self.simulate_class = obj
                        break
                if not self.simulate_class and hasattr(self.module, 'Simulate'):
                    self.simulate_class = self.module.Simulate
                return True
        except Exception as e:
            print(f"[SimulateWrapper] Failed to load organ: {e}", file=sys.stderr)
        return False
    
    def run_simulation(self, context: Dict[str, Any], phase: SimulationPhase) -> SimulationResult:
        start = time.perf_counter()
        if not self.simulate_class:
            return SimulationResult(phase, False, error="Simulate class not loaded", duration_ms=(time.perf_counter()-start)*1000)
        try:
            instance = self.simulate_class()
            for method_name in ['run', 'simulate', 'execute', 'process', '__call__']:
                if hasattr(instance, method_name):
                    method = getattr(instance, method_name)
                    result = method(context)
                    return SimulationResult(phase, True, output=result, duration_ms=(time.perf_counter()-start)*1000)
            if callable(instance):
                result = instance(context)
                return SimulationResult(phase, True, output=result, duration_ms=(time.perf_counter()-start)*1000)
            return SimulationResult(phase, False, error="No callable simulation method found", duration_ms=(time.perf_counter()-start)*1000)
        except Exception as e:
            return SimulationResult(phase, False, error=str(e), duration_ms=(time.perf_counter()-start)*1000)

class ForgeLoopIntegrator:
    def __init__(self, config: ForgeLoopConfig, data_root: Optional[Path] = None):
        self.config = config
        self.data_root = data_root or Path(__file__).parent
        self.simulate_wrapper = None
        self.simulation_history: List[SimulationResult] = []
        self._init_simulate_organ()
    
    def _init_simulate_organ(self):
        organ_path = self.data_root / self.config.simulate_organ_path
        if organ_path.exists():
            self.simulate_wrapper = SimulateOrganWrapper(organ_path)
        else:
            for candidate in [
                self.data_root / 'organs' / 'simulate.py',
                self.data_root / 'tools' / 'simulate.py',
                self.data_root / 'simulate.py',
            ]:
                if candidate.exists():
                    self.simulate_wrapper = SimulateOrganWrapper(candidate)
                    break
    
    def _build_context(self, phase: SimulationPhase, iteration: int = 0, swarm_data: Dict = None) -> Dict[str, Any]:
        context = {
            'phase': phase.value,
            'iteration': iteration,
            'timestamp': time.time(),
            'data_root': str(self.data_root),
        }
        if swarm_data:
            context.update(swarm_data)
        return context
    
    def trigger_simulation(self, phase: SimulationPhase, iteration: int = 0, swarm_data: Dict = None) -> SimulationResult:
        if not self.simulate_wrapper:
            return SimulationResult(phase, False, error="Simulate organ not available")
        context = self._build_context(phase, iteration, swarm_data)
        result = self.simulate_wrapper.run_simulation(context, phase)
        self.simulation_history.append(result)
        return result
    
    def run_pre_swarm(self, swarm_data: Dict = None) -> SimulationResult:
        if not self.config.enable_pre_swarm:
            return SimulationResult(SimulationPhase.PRE_SWARM, True, output="skipped")
        return self.trigger_simulation(SimulationPhase.PRE_SWARM, 0, swarm_data)
    
    def run_post_swarm(self, swarm_data: Dict = None) -> SimulationResult:
        if not self.config.enable_post_swarm:
            return SimulationResult(SimulationPhase.POST_SWARM, True, output="skipped")
        return self.trigger_simulation(SimulationPhase.POST_SWARM, 0, swarm_data)
    
    def run_pre_iteration(self, iteration: int, swarm_data: Dict = None) -> SimulationResult:
        if not self.config.enable_pre_iteration:
            return SimulationResult(SimulationPhase.PRE_ITERATION, True, output="skipped")
        return self.trigger_simulation(SimulationPhase.PRE_ITERATION, iteration, swarm_data)
    
    def run_post_iteration(self, iteration: int, swarm_data: Dict = None) -> SimulationResult:
        if not self.config.enable_post_iteration:
            return SimulationResult(SimulationPhase.POST_ITERATION, True, output="skipped")
        return self.trigger_simulation(SimulationPhase.POST_ITERATION, iteration, swarm_data)
    
    def get_statistics(self) -> Dict[str, Any]:
        if not self.simulation_history:
            return {'total': 0, 'successful': 0, 'failed': 0, 'avg_duration_ms': 0}
        successful = [r for r in self.simulation_history if r.success]
        failed = [r for r in self.simulation_history if not r.success]
        return {
            'total': len(self.simulation_history),
            'successful': len(successful),
            'failed': len(failed),
            'avg_duration_ms': sum(r.duration_ms for r in self.simulation_history) / len(self.simulation_history),
            'by_phase': {
                phase.value: {
                    'count': len([r for r in self.simulation_history if r.phase == phase]),
                    'success': len([r for r in self.simulation_history if r.phase == phase and r.success])
                }
                for phase in SimulationPhase
            }
        }

if __name__ == "__main__":
    # Demo usage
    config = ForgeLoopConfig()
    integrator = ForgeLoopIntegrator(config)
    print("Forge Simulation Integration Module loaded")
    print(f"Simulate organ loaded: {integrator.simulate_wrapper is not None}")
    if integrator.simulate_wrapper:
        result = integrator.run_pre_swarm({'goal': 'Simulationen öfter anwenden'})
        print(f"Pre-swarm simulation: {result.success} - {result.error or 'OK'}")
