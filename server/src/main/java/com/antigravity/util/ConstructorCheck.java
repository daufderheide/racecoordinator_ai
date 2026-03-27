package com.antigravity.util;

import com.antigravity.race.Race;
import java.lang.reflect.Constructor;

public class ConstructorCheck {
    public static void main(String[] args) {
        System.out.println("Constructors for com.antigravity.race.Race:");
        for (Constructor<?> c : Race.class.getConstructors()) {
            System.out.print("  " + c.getParameterCount() + " args: ");
            for (Class<?> p : c.getParameterTypes()) {
                System.out.print(p.getName() + ", ");
            }
            System.out.println();
        }
    }
}
