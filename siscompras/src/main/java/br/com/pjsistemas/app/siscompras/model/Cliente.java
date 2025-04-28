package br.com.pjsistemas.app.siscompras.model;

import java.util.Date;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.ManyToOne;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.Digits;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotEmpty;

@Entity
@AttributeOverride(name = "id", column = @Column(name = "cliente_id"))
public class Cliente extends BaseEntity {

	/**
	 * Serial
	 */
	private static final long serialVersionUID = 5952392618107168139L;

	@NotEmpty
	@Size(min = 1, max = 40, message = "Um nome precisa ter no minimo 5 caracteres e no maximo 40")
	@Pattern(regexp = "[A-Za-z ]*", message = "Precisa conter apenas letras e espaços")
	private String nome;

	@NotEmpty
	@Email(message = "Digite um email valido")
	@Column(unique = true)
	private String email;

	@Size(min = 10, max = 12, message = "Um telefone precisa ter no minimo 10 digitos e no maximo 12")
	@Digits(fraction = 0, integer = 12)
	private String telefone;

	@Temporal(TemporalType.DATE)
	private Date dataNascimento;

	@Enumerated(EnumType.STRING)
	private Sexo sexo;

	@Embedded
	private Endereco endereco;

	@ManyToOne
	
	private CategoriaCliente categoriaCliente;
	
	

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getTelefone() {
		return telefone;
	}

	public void setTelefone(String telefone) {
		this.telefone = telefone;
	}

	public Date getDataNascimento() {
		return dataNascimento;
	}

	public void setDataNascimento(Date dataNascimento) {
		this.dataNascimento = dataNascimento;
	}

	public Sexo getSexo() {
		return sexo;
	}

	public void setSexo(Sexo sexo) {
		this.sexo = sexo;
	}

	public Endereco getEndereco() {
		return endereco;
	}

	public void setEndereco(Endereco endereco) {
		this.endereco = endereco;
	}

	public CategoriaCliente getCategoriaCliente() {
		return categoriaCliente;
	}

	public void setCategoriaCliente(CategoriaCliente categoriaCliente) {
		this.categoriaCliente = categoriaCliente;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result
				+ ((dataNascimento == null) ? 0 : dataNascimento.hashCode());
		result = prime * result + ((email == null) ? 0 : email.hashCode());
		result = prime * result + ((nome == null) ? 0 : nome.hashCode());
		result = prime * result + ((sexo == null) ? 0 : sexo.hashCode());
		return result;
	}

	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		Cliente other = (Cliente) obj;
		if (dataNascimento == null) {
			if (other.dataNascimento != null)
				return false;
		} else if (!dataNascimento.equals(other.dataNascimento))
			return false;
		if (email == null) {
			if (other.email != null)
				return false;
		} else if (!email.equals(other.email))
			return false;
		if (nome == null) {
			if (other.nome != null)
				return false;
		} else if (!nome.equals(other.nome))
			return false;
		if (sexo != other.sexo)
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "Cliente [nome=" + nome + ", email=" + email + ", telefone="
				+ telefone + ", dataNascimento=" + dataNascimento + "]";
	}

}
