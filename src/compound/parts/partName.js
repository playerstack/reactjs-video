// Static key used to tag composable parts so the resolver can identify them by type.
// Each composable sets this on its function (`Fn[PART_NAME] = 'Volume'`) and the
// resolver reads it back as `child.type[PART_NAME]` while scanning React children.
export const PART_NAME = '__playerstackPartName__';
