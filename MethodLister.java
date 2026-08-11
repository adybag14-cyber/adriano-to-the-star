import java.lang.reflect.Method;

public class MethodLister {
    public static void main(String[] args) throws Exception {
        Class<?> clazz = Class.forName("com.fs.starfarer.settings.StarfarerSettings");
        for (Method m : clazz.getDeclaredMethods()) {
            if (m.getReturnType().equals(void.class) && m.getParameterCount() == 0 && java.lang.reflect.Modifier.isStatic(m.getModifiers())) {
                System.out.println("FOUND VOID STATIC METHOD: " + m.getName());
            }
        }
    }
}
