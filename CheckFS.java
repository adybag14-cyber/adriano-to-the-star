
import java.io.File;

public class CheckFS {
    public static void main(String[] args) {
        System.out.println("=== CheckFS START ===");
        System.out.println("user.dir: " + System.getProperty("user.dir"));
        
        listDir(new File("."));
        listDir(new File("mods"));
        listDir(new File("/files"));
        listDir(new File("/files/mods"));
        listDir(new File("/app"));
        listDir(new File("/mods"));
        
        System.out.println("Attempting to read enabled_mods.json...");
        readFile(new File("mods/enabled_mods.json"));
        readFile(new File("/files/mods/enabled_mods.json"));
        
        System.out.println("=== CheckFS END ===");
    }

    private static void listDir(File d) {
        System.out.println("List: " + d.getAbsolutePath() + " (Exists: " + d.exists() + ", IsDir: " + d.isDirectory() + ")");
        if (d.exists() && d.isDirectory()) {
            File[] files = d.listFiles();
            if (files != null) {
                for (File f : files) {
                    System.out.println("  - " + f.getName());
                }
            } else {
                System.out.println("  listFiles returned null");
            }
        }
    }
    
    private static void readFile(File f) {
        System.out.println("Read: " + f.getAbsolutePath() + " (Exists: " + f.exists() + ")");
    }
}
