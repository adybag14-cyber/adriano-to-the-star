import fara_computer_agent

print("🧪 Testing Advanced Tools...")

# Test list_guides
print("\n--- Testing list_guides ---")
guides = fara_computer_agent.list_guides()
print(guides)

# Test read_guide
print("\n--- Testing read_guide ---")
content = fara_computer_agent.read_guide("vscode_guide.md")
print(content[:100] + "...")

# Test get_system_status
print("\n--- Testing get_system_status ---")
status = fara_computer_agent.get_system_status()
print(status)

# Test inspect_file_tree
print("\n--- Testing inspect_file_tree ---")
tree = fara_computer_agent.inspect_file_tree("fara_guides")
print(tree)

print("\n✅ Advanced tools verification complete.")
