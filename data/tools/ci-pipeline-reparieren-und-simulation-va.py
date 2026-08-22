import json

# Load existing config (could be from file)
config = {"roles": ["builder", "builder", "planner", "builder", "critic"]}

# Ensure at least one planner and critic
required = {"planner", "critic"}
current = set(config.get("roles", []))
missing = required - current

if missing:
    # Add missing roles (once each)
    config["roles"].extend(list(missing))
    print(f"Added missing roles: {missing}")

# Write back updated config (example to file)
with open("ci_pipeline_config.json", "w") as f:
    json.dump(config, f, indent=2)

# Report distribution
roles = config.get("roles", [])
counts = {r: roles.count(r) for r in set(roles)}
print("Rollenverteilung:", counts)
if counts.get("planner",0) == 0:
    print("WARN: Kein Planner vorhanden")
if counts.get("critic",0) == 0:
    print("WARN: Kein Critic vorhanden")
