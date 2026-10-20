package com.tuchefpersonal.app.modelo;

public class Receta {
    private int id;
    private int idUsuario;
    private String titulo;
    private String contenido;
    private String ingredientesUsados;
    private String fechaGeneracion;
    private boolean favorito;

    public Receta(int id, int idUsuario, String titulo, String contenido, String ingredientesUsados, String fechaGeneracion) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.titulo = titulo;
        this.contenido = contenido;
        this.ingredientesUsados = ingredientesUsados;
        this.fechaGeneracion = fechaGeneracion;
        this.favorito = false;
    }

    // Getters y setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getIdUsuario() { return idUsuario; }
    public void setIdUsuario(int idUsuario) { this.idUsuario = idUsuario; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getContenido() { return contenido; }
    public void setContenido(String contenido) { this.contenido = contenido; }

    public String getIngredientesUsados() { return ingredientesUsados; }
    public void setIngredientesUsados(String ingredientesUsados) { this.ingredientesUsados = ingredientesUsados; }

    public String getFechaGeneracion() { return fechaGeneracion; }
    public void setFechaGeneracion(String fechaGeneracion) { this.fechaGeneracion = fechaGeneracion; }

    public boolean isFavorito() { return favorito; }
    public void setFavorito(boolean favorito) { this.favorito = favorito; }
}