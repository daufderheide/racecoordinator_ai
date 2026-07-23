#ifndef _MOS_OS_WINDOWS_USER_H_
#define _MOS_OS_WINDOWS_USER_H_

#include <sys/stat.h>
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <time.h>
#include <process.h>
#include <wtypes.h>
#ifndef EXCLUDE_INT_LIMIT_DEFS
#include <ntintsafe.h>
#endif
#include <winnt.h>

#include "mos_registry-Windows.h"

#define srandom(x)		(srand(x))
#define random()		(rand())
#ifndef va_copy
#define va_copy(dst, src)	do { (dst) = (src); } while (0)
#endif

MOSAPI int MOSCConv mos_windows_error_to_err(DWORD);
MOSAPI int MOSCConv mos_windows_error(mosiop_t, DWORD);
MOSAPI int MOSCConv mos_windows_wsa_error_to_err(int);
MOSAPI int MOSCConv mos_windows_wsa_error(mosiop_t, int);
MOSAPI const char * MOSCConv mos_windows_strerror(DWORD error, char *msgbuf, size_t msgbufsz);

#define stat(fn, st) _stat(fn, (struct _stat *)st)

#endif /* _MOS_OS_WINDOWS_USER_H_ */
