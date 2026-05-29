export enum Role {
  VIEWER = "VIEWER",
  DIRECTOR = "DIRECTOR",
  ADMIN = "ADMIN",
}

export function isAtLeast(current: Role, required: Role): boolean {
  const levels = {
    [Role.VIEWER]: 1,
    [Role.DIRECTOR]: 2,
    [Role.ADMIN]: 3,
  };
  return levels[current] >= levels[required];
}
