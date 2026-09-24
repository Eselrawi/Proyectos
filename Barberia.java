/**
 * PROBLEMA DE LOS BARBEROS DORMILONES
 * 
 * Simula una peluquería con:
 * - N barberos
 * - M sillas
 * - Clientes que llegan aleatoriamente
 * 
 * Los barberos duermen si no hay clientes
 * Los clientes se marchan si no hay sillas
 * 
 * @author [PON AQUÍ TU NOMBRE]
 * @version 1.0
 */

import java.util.concurrent.*;
import java.util.Random;

public class Barberia {
    
    // ===== CONFIGURACIÓN =====
    // Cambia estos números para probar diferentes situaciones
    private static final int NUM_BARBEROS = 2;    // Número de barberos
    private static final int NUM_SILLAS = 5;      // Número de sillas
    private static final int TOTAL_CLIENTES = 15; // Clientes que van a llegar
    
    public static void main(String[] args) {
        
        // Mensaje de bienvenida
        System.out.println("╔════════════════════════════════╗");
        System.out.println("║   BARBERÍA DORMILONA           ║");
        System.out.println("╠════════════════════════════════╣");
        System.out.println("║  Barberos: " + NUM_BARBEROS + "                  ║");
        System.out.println("║  Sillas:   " + NUM_SILLAS + "                  ║");
        System.out.println("║  Clientes: " + TOTAL_CLIENTES + "                 ║");
        System.out.println("╚════════════════════════════════╝");
        System.out.println();
        
        // ===== RECURSOS COMPARTIDOS =====
        // Las sillas libres (fairness=true para evitar inanición)
        Semaphore sillasLibres = new Semaphore(NUM_SILLAS, true);
        
        // Cola de espera de clientes (FIFO)
        BlockingQueue<Cliente> colaEspera = new LinkedBlockingQueue<>(NUM_SILLAS);
        
        // Contadores (uso arrays para poder modificarlos desde las clases)
        int[] atendidos = {0};
        int[] rechazados = {0};
        int[] cortes = {0};
        
        // ===== CREAR Y LANZAR BARBEROS =====
        Barbero[] barberos = new Barbero[NUM_BARBEROS];
        Thread[] hilosBarberos = new Thread[NUM_BARBEROS];
        
        for (int i = 0; i < NUM_BARBEROS; i++) {
            barberos[i] = new Barbero(i, colaEspera, cortes);
            hilosBarberos[i] = new Thread(barberos[i]);
            hilosBarberos[i].start();
        }
        
        // ===== CREAR Y LANZAR CLIENTES =====
        Random random = new Random();
        Thread[] hilosClientes = new Thread[TOTAL_CLIENTES];
        
        System.out.println("--- EMPIEZAN A LLEGAR CLIENTES ---");
        System.out.println();
        
        for (int i = 0; i < TOTAL_CLIENTES; i++) {
            Cliente cliente = new Cliente(i, sillasLibres, colaEspera, atendidos, rechazados);
            hilosClientes[i] = new Thread(cliente);
            hilosClientes[i].start();
            
            // Los clientes llegan en momentos aleatorios
            try {
                Thread.sleep(random.nextInt(400));
            } catch (InterruptedException e) {
                System.out.println("Error en la llegada de clientes");
            }
        }
        
        // ===== ESPERAR A QUE TERMINEN TODOS LOS CLIENTES =====
        for (int i = 0; i < TOTAL_CLIENTES; i++) {
            try {
                hilosClientes[i].join();
            } catch (InterruptedException e) {
                System.out.println("Error esperando a cliente " + i);
            }
        }
        
        // ===== PARAR LOS BARBEROS =====
        System.out.println();
        System.out.println("--- NO LLEGAN MÁS CLIENTES ---");
        System.out.println();
        
        for (Barbero b : barberos) {
            b.parar();
        }
        
        // Espero un poco a que los barberos terminen
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {}
        
        // ===== MOSTRAR RESULTADOS =====
        System.out.println();
        System.out.println("╔════════════════════════════════╗");
        System.out.println("║         RESULTADOS             ║");
        System.out.println("╠════════════════════════════════╣");
        System.out.println("║  Clientes atendidos:  " + atendidos[0] + "      ║");
        System.out.println("║  Clientes rechazados: " + rechazados[0] + "      ║");
        System.out.println("║  Cortes realizados:   " + cortes[0] + "      ║");
        System.out.println("║  Total clientes:      " + (atendidos[0] + rechazados[0]) + "      ║");
        System.out.println("╚════════════════════════════════╝");
        
        if (atendidos[0] + rechazados[0] == TOTAL_CLIENTES) {
            System.out.println();
            System.out.println("✅ SIMULACIÓN COMPLETADA CON ÉXITO");
        }
    }
}