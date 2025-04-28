package br.com.pjsistemas.app.siscompras.model;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.validation.constraints.Size;

import org.hibernate.validator.constraints.NotEmpty;

@Entity
@Table(name = "tipo_produto")
@AttributeOverride(name = "id", column = @Column(name = "tipo_produto_id"))
public class TipoProduto extends BaseEntity {

	private static final long serialVersionUID = 1344354777415757978L;

	@Column(unique = true)
	@Size(min = 4, max = 40, message = "Uma categoria de produto precisa ter no mínimo 4 caracteres e no máximo 40")
	@NotEmpty
	private String descricao;

	public TipoProduto() {
		super();
	}

	public TipoProduto(Long id) {
		super(id);
	}

	public TipoProduto(String descricao) {
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
		if (!(obj instanceof TipoProduto))
			return false;
		TipoProduto other = (TipoProduto) obj;
		if (descricao == null) {
			if (other.descricao != null)
				return false;
		} else if (!descricao.equals(other.descricao))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "TipoProduto [descricao=" + descricao + ", getId()=" + getId()
				+ "]";
	}

}
