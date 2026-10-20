package com.tuchefpersonal.app;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.textfield.TextInputEditText;
import com.tuchefpersonal.app.modelo.Usuario;
import com.tuchefpersonal.app.utils.SessionManager;

public class LoginActivity extends AppCompatActivity {

    private TextInputEditText etEmail, etContrasena;
    private Button btnLogin;
    private TextView tvIrRegistro;
    private SessionManager sessionManager;
    private UsuarioDAO usuarioDAO;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        sessionManager = new SessionManager(this);
        usuarioDAO = new UsuarioDAO(this);

        if (sessionManager.haySesion()) {
            irAMain();
            return;
        }

        etEmail = findViewById(R.id.etEmail);
        etContrasena = findViewById(R.id.etContrasena);
        btnLogin = findViewById(R.id.btnLogin);
        tvIrRegistro = findViewById(R.id.tvIrRegistro);

        btnLogin.setOnClickListener(v -> hacerLogin());
        tvIrRegistro.setOnClickListener(v -> startActivity(new Intent(this, RegisterActivity.class)));
    }

    private void hacerLogin() {
        String email = etEmail.getText().toString().trim();
        String contrasena = etContrasena.getText().toString().trim();

        if (email.isEmpty() || contrasena.isEmpty()) {
            Toast.makeText(this, "Rellena todos los campos", Toast.LENGTH_SHORT).show();
            return;
        }

        Usuario usuario = usuarioDAO.login(email, contrasena);
        if (usuario != null) {
            sessionManager.guardarSesion(usuario.getId(), usuario.getNombre(), usuario.getEmail());
            irAMain();
        } else {
            Toast.makeText(this, "Email o contraseña incorrectos", Toast.LENGTH_SHORT).show();
        }
    }

    private void irAMain() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}