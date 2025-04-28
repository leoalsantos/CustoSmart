package br.com.pjsistemas.app.siscompras.model;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.validation.constraints.Size;

import org.hibernate.validator.constraints.NotBlank;

/**
 * CategoriaProduto
 */
@Entity
@Table(name = "categoria_produto")
@AttributeOverride(name = "id", column = @Column(name = "categoria_produto_id"))
public class CategoriaProduto extends BaseEntity {

	private static final long serialVersionUID = -6793745574689983967L;

	@Column(unique = true)
	@NotBlank(message = "Campo obrigatório")
	@Size(min = 4, max = 40, message = "Uma categoria de produto precisa ter no mínimo 4 caracteres e no máximo 40")
	private String descricao;

	public CategoriaProduto() {
		super();
	}

	public CategoriaProduto(Long id) {
		super(id);
	}

	public CategoriaProduto(String descricao) {
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
		if (!(obj instanceof CategoriaProduto))
			return false;
		CategoriaProduto other = (CategoriaProduto) obj;
		if (descricao == null) {
			if (other.descricao != null)
				return false;
		} else if (!descricao.equals(other.descricao))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "CategoriaProduto [descricao=" + descricao + ", getId()="
				+ getId() + "]";
	}

}
