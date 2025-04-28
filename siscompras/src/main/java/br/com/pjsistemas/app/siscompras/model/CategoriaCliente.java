package br.com.pjsistemas.app.siscompras.model;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;

import org.hibernate.validator.constraints.NotBlank;

/**
 * CategoriaCliente entidade de pesquisa
 */
@Entity
@Table(name = "categoria_cliente")
@AttributeOverride(name = "id", column = @Column(name = "categoria_cliente_id"))
public class CategoriaCliente extends BaseEntity {

	/**
	 * Serial.
	 */
	private static final long serialVersionUID = 2022164993416758521L;

	@NotBlank
	@Column(unique = true)
	private String descricao;

	public CategoriaCliente() {
		super();
	}

	public CategoriaCliente(Long id) {
		super(id);
	}

	public CategoriaCliente(String descricao) {
		super();
		this.descricao = descricao;
	}

	public String getDescricao() {
		return descricao;
	}

	public void setDescricao(String descricao) {
		this.descricao = descricao;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result
				+ ((descricao == null) ? 0 : descricao.hashCode());
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
		CategoriaCliente other = (CategoriaCliente) obj;
		if (descricao == null) {
			if (other.descricao != null)
				return false;
		} else if (!descricao.equals(other.descricao))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "CategoriaCliente [descricao=" + descricao + "]";
	}

}
