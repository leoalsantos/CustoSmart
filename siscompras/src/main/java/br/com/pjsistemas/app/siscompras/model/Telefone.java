package br.com.pjsistemas.app.siscompras.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import javax.validation.constraints.Digits;
import javax.validation.constraints.Size;

@Entity
public class Telefone extends BaseEntity {

	private static final long serialVersionUID = 7643176048909458700L;

	@Size(min = 10, max = 12, message = "Um telefone precisa ter no minimo 10 digitos e no maximo 12")
	@Digits(fraction = 0, integer = 12)
	@Column(unique = true)
	private String numero;

	private String tipoTelefone;

	@OneToOne
	@JoinColumn(name = "cliente_id")
	private Cliente cliente;

	@OneToOne
	@JoinColumn(name = "fornecedor_id")
	private Cliente fornecedor;

	public String getNumero() {
		return numero;
	}

	public void setNumero(String numero) {
		this.numero = numero;
	}

	public String getTipo() {
		return tipoTelefone;
	}

	public void setTipo(String tipo) {
		this.tipoTelefone = tipo;
	}

	public Cliente getCliente() {
		return cliente;
	}

	public void setCliente(Cliente cliente) {
		this.cliente = cliente;
	}

	public Telefone() {
		// TODO Auto-generated constructor stub
	}

	@Override
	public int hashCode() {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public boolean equals(Object obj) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public String toString() {
		// TODO Auto-generated method stub
		return super.toString();
	}

}
