export class GroupOptions {
  enabled: boolean = false;
  max_groups: number = 1;
  balance: boolean = false;
  allow_empty_lanes: boolean = true;
  force_multiple_of_max: boolean = false;
  rotate_group_heats: boolean = true;
  min_advancing: number = 0;
  names: string[] = [];

  constructor(
    enabled: boolean = false,
    max_groups: number = 1,
    balance: boolean = false,
    allow_empty_lanes: boolean = true,
    force_multiple_of_max: boolean = false,
    rotate_group_heats: boolean = true,
    min_advancing: number = 0,
    names: string[] = [],
  ) {
    this.enabled = enabled;
    this.max_groups = max_groups;
    this.balance = balance;
    this.allow_empty_lanes = allow_empty_lanes;
    this.force_multiple_of_max = force_multiple_of_max;
    this.rotate_group_heats = rotate_group_heats;
    this.min_advancing = min_advancing;
    this.names = names ? [...names] : [];
  }
}
