- `^signuplist dm`: Sends in a private message the entire contents of the signup list, including fields not shown with the regular `^signuplist` command.
- `^track dm`: Sends in a private message the entire contents of the progress tracker, including hidden entries and fields not shown with the regular `^track` command.
- `^progress <id>`: Registers progress for the tracker entry with ID# `<id>`.  ID numbers can be found using the `^track dm` command.
- `^enable <id>`: Unhides the tracker entry with ID# `<id>`.  ID numbers can be found using the `^track dm` command.
- `^health dm`: Sends in a private message all character health info.
- `^damage <id>`: Deals one damage to the character with ID# `<id>`.
- `^heal <id>`: Heals one damage from the character with ID# `<id>`.
- `^init remove <id>`: Removes the character with ID# `<id>` from the initiative order.
- `^init switch <id1> <id2>`: Switches the initiative rolls of the characters with ID#s `<id1>` and `<id2>`.
- `^init name <id> <character name>`: Renames the character with ID# `<id>` to `<character name>`.
- `^init reset`: Deletes the initiative list.