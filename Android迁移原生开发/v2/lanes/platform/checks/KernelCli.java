import app.cash.quickjs.QuickJs;
import java.nio.file.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
// Host-only line protocol, one real JNI realm per request, no engine or ledger mocks.
class KernelCli {
  public static void main(String[] args) throws Exception {
    var script = Files.readString(Path.of(args[0])); var clock = Files.readString(Path.of(args[1]));
    var input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
    String line; while((line=input.readLine())!=null){
      try(var js = QuickJs.create()) {
        if(line.startsWith("CLOCK ")){js.evaluate(clock);line=line.substring(6);}
        js.evaluate(script,"platform-kernel.js");
        String req=line;js.set("hostInput",Input.class,()->req);
        String value=(String)js.evaluate("eivraPlatform.call(hostInput.json())");
        System.out.println("OK "+Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8)));
      } catch(Exception ex) {ex.printStackTrace(System.err);System.out.println("ERROR "+Base64.getEncoder().encodeToString(ex.toString().getBytes(StandardCharsets.UTF_8)));if(args.length>2)System.exit(1);}
    }
  }
  public interface Input { String json(); }
}
