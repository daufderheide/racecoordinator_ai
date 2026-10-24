package com.antigravity.util;

import java.io.Serializable;
import java.util.Comparator;

/**
 * Natural order / logical sorting comparator.
 *
 * <p>Compares strings alphanumerically, treating numeric substrings as numbers so that e.g. "Driver
 * 9" sorts before "Driver 10" instead of the standard lexicographic "Driver 10" before "Driver 2".
 */
public class LogicalSortComparator implements Comparator<String>, Serializable {

  private static final long serialVersionUID = 1L;

  public static final LogicalSortComparator INSTANCE = new LogicalSortComparator();

  @Override
  public int compare(String s1, String s2) {
    return compareLogical(s1, s2);
  }

  /**
   * Compares two strings in logical / natural sort order.
   *
   * @param a the first string
   * @param b the second string
   * @return negative if a &lt; b, zero if a == b, positive if a &gt; b
   */
  public static int compareLogical(String a, String b) {
    if (a == null && b == null) {
      return 0;
    }
    if (a == null) {
      return -1;
    }
    if (b == null) {
      return 1;
    }

    int i = 0;
    int j = 0;
    int lenA = a.length();
    int lenB = b.length();

    while (i < lenA && j < lenB) {
      char ca = a.charAt(i);
      char cb = b.charAt(j);

      if (Character.isDigit(ca) && Character.isDigit(cb)) {
        // Extract numeric sequence from a
        int startA = i;
        while (i < lenA && Character.isDigit(a.charAt(i))) {
          i++;
        }
        // Extract numeric sequence from b
        int startB = j;
        while (j < lenB && Character.isDigit(b.charAt(j))) {
          j++;
        }

        String numStrA = a.substring(startA, i);
        String numStrB = b.substring(startB, j);

        // Strip leading zeros for mathematical value comparison
        String trimmedA = numStrA.replaceFirst("^0+", "");
        String trimmedB = numStrB.replaceFirst("^0+", "");

        // Compare lengths of significant digits
        int lenCmp = Integer.compare(trimmedA.length(), trimmedB.length());
        if (lenCmp != 0) {
          return lenCmp;
        }

        // Compare digit-by-digit
        int numCmp = trimmedA.compareTo(trimmedB);
        if (numCmp != 0) {
          return numCmp;
        }

        // Numbers have the same numeric value; tie-break by number of leading zeros
        // Fewer characters (fewer leading zeros) comes first (e.g. "1" before "01")
        int zeroCmp = Integer.compare(numStrA.length(), numStrB.length());
        if (zeroCmp != 0) {
          return zeroCmp;
        }
      } else {
        char lowerA = Character.toLowerCase(ca);
        char lowerB = Character.toLowerCase(cb);
        if (lowerA != lowerB) {
          return Character.compare(lowerA, lowerB);
        }
        i++;
        j++;
      }
    }

    if (lenA != lenB) {
      return Integer.compare(lenA, lenB);
    }

    // Secondary tie-breaker for case differences (e.g., "driver 1" vs "Driver 1")
    return a.compareTo(b);
  }
}
