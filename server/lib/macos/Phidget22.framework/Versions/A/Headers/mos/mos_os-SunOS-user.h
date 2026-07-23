#ifndef _MOS_OS_SUNUSER_H_
#define _MOS_OS_SUNUSER_H_

#include <stdarg.h>
#include <stdio.h>				/* for vsnprintf() */
#include <stdlib.h>				/* for malloc() */
#include <string.h>				/* for strlcpy() */

#define bcopy(src, dst, len) memcpy((dst), (src), (len))
#define bzero(addr, len) memset((addr), 0, (len))

#endif /* _MOS_OS_SUNUSER_H_ */
