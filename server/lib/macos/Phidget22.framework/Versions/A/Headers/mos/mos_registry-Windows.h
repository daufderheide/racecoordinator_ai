#ifndef _MOS_REGISTRY_WINDOWS_H_
#define _MOS_REGISTRY_WINDOWS_H_

#include "mos_iop.h"

/*
 * Gets a registry value, ignoring type.  Specify key, value, and
 * returns registry buffer, size of registry buffer, offset of value
 * data in registry buffer, and length of data.
 */
MOSAPI int MOSCConv mos_registry_getmachinevalue(mosiop_t, const char *, const char *,
  void **, uint32_t *, uint32_t *, uint32_t *);

/*
 * Retrieves a numeric value from the registry.  Uses the given default
 * if there is no entry, otherwise returns an error (e.g. couldn't access
 * registry, or parse value).
 */
MOSAPI int MOSCConv mos_registry_getu32(mosiop_t, const char *, const char *, uint32_t *,
  uint32_t);

/*
 * Sets a registry value for given key.
 */
#ifndef _KERNEL
MOSAPI int MOSCConv mos_registry_setmachinevalue(mosiop_t, const char *, const char *,
  const void *, uint32_t);
#endif

#endif /* _MOS_REGISTRY_WINDOWS_H_ */
