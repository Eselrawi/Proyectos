package com.tuchefpersonal.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.tuchefpersonal.app.modelo.Receta;
import java.util.List;

public class RecetaAdapter extends RecyclerView.Adapter<RecetaAdapter.ViewHolder> {

    public interface OnFavoritoListener {
        void onFavorito(Receta receta, int position);
    }

    public interface OnRecetaClickListener {
        void onRecetaClick(Receta receta);
    }

    public interface OnEliminarListener {
        void onEliminar(Receta receta, int position);
    }

    private List<Receta> lista;
    private OnFavoritoListener favoritoListener;
    private OnRecetaClickListener clickListener;
    private OnEliminarListener eliminarListener;

    public RecetaAdapter(List<Receta> lista, OnFavoritoListener favoritoListener, OnRecetaClickListener clickListener, OnEliminarListener eliminarListener) {
        this.lista = lista;
        this.favoritoListener = favoritoListener;
        this.clickListener = clickListener;
        this.eliminarListener = eliminarListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_receta, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Receta receta = lista.get(position);
        holder.tvTitulo.setText(receta.getTitulo());
        holder.tvFecha.setText(receta.getFechaGeneracion());
        holder.tvIngredientes.setText("📋 " + receta.getIngredientesUsados());
        holder.btnFavorito.setText(receta.isFavorito() ? "❤️" : "🤍");
        holder.btnFavorito.setOnClickListener(v -> favoritoListener.onFavorito(receta, position));
        holder.btnEliminar.setOnClickListener(v -> eliminarListener.onEliminar(receta, position));
        holder.itemView.setOnClickListener(v -> clickListener.onRecetaClick(receta));
    }

    @Override
    public int getItemCount() {
        return lista.size();
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvTitulo, tvFecha, tvIngredientes;
        Button btnFavorito, btnEliminar;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTitulo = itemView.findViewById(R.id.tvTituloReceta);
            tvFecha = itemView.findViewById(R.id.tvFechaReceta);
            tvIngredientes = itemView.findViewById(R.id.tvIngredientesReceta);
            btnFavorito = itemView.findViewById(R.id.btnFavorito);
            btnEliminar = itemView.findViewById(R.id.btnEliminarReceta);
        }
    }
}