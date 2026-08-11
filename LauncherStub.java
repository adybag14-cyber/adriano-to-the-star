import java.lang.reflect.Method;

public class LauncherStub {
    public static void main(String[] args) throws Throwable {
        System.out.println("STUB: Searching for loadSettings() via Reflection...");
        try {
/*
            Class<?> clazz = Class.forName("com.fs.starfarer.settings.StarfarerSettings");
            for (Method m : clazz.getDeclaredMethods()) {
                if (java.lang.reflect.Modifier.isStatic(m.getModifiers()) && 
                    m.getReturnType().equals(void.class) && 
                    m.getParameterCount() == 0) {
                    
                    Class<?>[] exceptions = m.getExceptionTypes();
                    if (exceptions.length >= 1) {
                        System.out.println("STUB: Found candidate: " + m.getName());
                        m.setAccessible(true);
                        m.invoke(null);
                        System.out.println("STUB: Called successfully.");
                    }
                }
            }
*/
            
            System.out.println("STUB: Starting CombatMain...");
            Class<?> mainClazz = Class.forName("com.fs.starfarer.combat.CombatMain");
            Method mainMeth = mainClazz.getDeclaredMethod("main", String[].class);
            mainMeth.invoke(null, (Object)args);
            
        } catch (Throwable e) {
            System.err.println("STUB: ERROR!");
            e.printStackTrace();
        }
    }
}