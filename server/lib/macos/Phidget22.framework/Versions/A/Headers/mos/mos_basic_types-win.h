#ifndef _MOS_BASE_TYPES_WIN_H_
#define _MOS_BASE_TYPES_WIN_H_

//#define MOSExport	__declspec(dllexport)
#define MOSImport	__declspec(dllimport)

/*
 * The following types are nowhere to be found in the WDK, AFAICT:
 */
#ifdef WIN_WDK
typedef unsigned __int64	uint64_t;
typedef unsigned __int32	uint32_t;
typedef unsigned __int16	uint16_t;
typedef unsigned __int8		uint8_t;

typedef __int64				int64_t;
typedef __int32				int32_t;
typedef __int16				int16_t;
typedef __int8				int8_t;

typedef uint64_t			uintmax_t;
typedef int64_t				intmax_t;

typedef unsigned char		u_char;
typedef unsigned short		u_short;
typedef unsigned int		u_int;
typedef unsigned long		u_long;

#else /* !WIN_WDK */
#include <stdint.h>
#endif

/*
 * Convenient things that may be redundant.
 */
//#define inline				__inline
#define	NULL				((void *)0)

/*
 * Define these if not already defined.
 */
#if !defined(ssize_t)
#if defined(_WIN64)
typedef int64_t				ssize_t;
#define SSIZE_MAX			INT64_MAX
#else
typedef int32_t				ssize_t;
#define SSIZE_MAX			INT32_MAX
#endif
#endif

#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *) __nan)
#endif

#endif /* _MOS_BASE_TYPES_WIN_H_ */
