public class TestLoad {
    public static void main(String[] args) {
        System.out.println("TestLoad: Starting...");
        try {
            System.out.println("TestLoad: Attempting to load lwjgl...");
            System.loadLibrary("lwjgl");
            System.out.println("TestLoad: SUCCESS - 'lwjgl' loaded!");
        } catch (UnsatisfiedLinkError e) {
            System.out.println("TestLoad: FAILED to load 'lwjgl'");
            e.printStackTrace();
        } catch (Throwable t) {
            System.out.println("TestLoad: Unexpected error");
            t.printStackTrace();
        }

        try {
            System.out.println("TestLoad: Attempting to load liblwjgl.so explicitly...");
            System.load("liblwjgl.so"); // try absolute/relative? usually needs abs path
            System.out.println("TestLoad: SUCCESS - 'liblwjgl.so' loaded!");
        } catch (UnsatisfiedLinkError e) {
            System.out.println("TestLoad: FAILED to load 'liblwjgl.so'");
        }

        System.out.println("TestLoad: Finished.");
    }
}
