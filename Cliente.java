/**
 * Clase que representa un cliente de la barbería
 * Cada cliente es un hilo independiente
 */
import java.util.concurrent.Semaphore;
import java.util.concurrent.BlockingQueue;

public class Cliente implements Runnable {
    
    private int id;
    private Semaphore sillasLibres;
    private BlockingQueue<Cliente> colaEspera;
    
    // Contadores compartidos (los paso como parámetros)
    private int[] atendidos;
    private int[] rechazados;
    
    public Cliente(int id, Semaphore sillasLibres, BlockingQueue<Cliente> colaEspera, 
                   int[] atendidos, int[] rechazados) {
        this.id = id;
        this.sillasLibres = sillasLibres;
        this.colaEspera = colaEspera;
        this.atendidos = atendidos;
        this.rechazados = rechazados;
    }
    
    @Override
    public void run() {
        System.out.println("[Cliente " + id + "] Llega a la barbería");
        
        // Intento conseguir una silla
        if (sillasLibres.tryAcquire()) {
            System.out.println("[Cliente " + id + "] Hay silla libre, me siento");
            
            try {
                // Me pongo en la cola de espera
                colaEspera.put(this);
                
                // Espero a que me atienda un barbero
                synchronized (this) {
                    this.wait();
                }
                
                // Me han atendido
                System.out.println("[Cliente " + id + "] Me han atendido, me voy contento");
                atendidos[0]++;
                
            } catch (InterruptedException e) {
                System.out.println("[Cliente " + id + "] Algo salió mal");
            } finally {
                // Libero la silla
                sillasLibres.release();
            }
            
        } else {
            System.out.println("[Cliente " + id + "] No hay sillas libres, me voy");
            rechazados[0]++;
        }
    }
    
    // Este método lo llama el barbero para despertarme
    public void despertar() {
        synchronized (this) {
            this.notify();
        }
    }
    
    public int getId() {
        return id;
    }
}