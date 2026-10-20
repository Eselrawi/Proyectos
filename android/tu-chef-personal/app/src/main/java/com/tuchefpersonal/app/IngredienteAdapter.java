package com.tuchefpersonal.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.tuchefpersonal.app.modelo.Ingrediente;
import java.util.List;

public class IngredienteAdapter extends RecyclerView.Adapter<IngredienteAdapter.ViewHolder> {

    public interface OnEliminarListener {
        void onEliminar(Ingrediente ingrediente, int position);
    }

    private List<Ingrediente> lista;
    private OnEliminarListener listener;

    public IngredienteAdapter(List<Ingrediente> lista, OnEliminarListener listener) {
        this.lista = lista;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_ingrediente, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Ingrediente ingrediente = lista.get(position);
        holder.tvNombre.setText(ingrediente.getNombre());
        holder.btnEliminar.setOnClickListener(v -> listener.onEliminar(ingrediente, position));
    }

    @Override
    public int getItemCount() { return lista.size(); }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvNombre;
        Button btnEliminar;
        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvNombre = itemView.findViewById(R.id.tvNombreIngrediente);
            btnEliminar = itemView.findViewById(R.id.btnEliminarIngrediente);
        }
    }
}