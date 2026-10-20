package com.tuchefpersonal.app.modelo;

public class Ingrediente {
    private int id;
    private int idUsuario;
    private String nombre;
    private String fechaAnadido;

    public Ingrediente() {}

    public Ingrediente(int id, int idUsuario, String nombre, String fechaAnadido) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.fechaAnadido = fechaAnadido;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getIdUsuario() { return idUsuario; }
    public void setIdUsuario(int idUsuario) { this.idUsuario = idUsuario; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getFechaAnadido() { return fechaAnadido; }
    public void setFechaAnadido(String fechaAnadido) { this.fechaAnadido = fechaAnadido; }
}