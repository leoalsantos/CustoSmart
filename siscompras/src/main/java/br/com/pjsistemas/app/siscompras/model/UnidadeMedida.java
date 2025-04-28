package br.com.pjsistemas.app.siscompras.model;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.Size;

import org.hibernate.validator.constraints.NotEmpty;

@Entity
@Table(name = "unidade_medida", uniqueConstraints = @UniqueConstraint(columnNames = { "descricao", "abreviacao" }))
@AttributeOverride(name = "id", column = @Column(name = "unidade_medida_id"))
public class UnidadeMedida extends BaseEntity {

	private static final long serialVersionUID = 2187644983589209898L;

	@NotEmpty(message = "Campo obrigatório")
	@Size(min = 4, max = 40, message = "Uma unidade de medida deve ter no mínimo 4 caracteres e no máximo 40")
	private String descricao;

	@NotEmpty(message = "Campo obrigatório")
	@Size(min = 2, max = 10, message = "Uma descrição deve ter no mínimo 2 caracteres e no máximo 10")
	private String abreviacao;

	public UnidadeMedida() {
		super();
	}

	public UnidadeMedida(Long id) {
		super(id);
	}

	public UnidadeMedida(String descricao, String abreviacao) {
		super();
		this.descricao = descricao;
		this.abreviacao = abreviacao;
	}

	public String getDescricao() {
		return descricao;
	}

	public void setDescricao(String descricao) {
		this.descricao = descricao;
	}

	public String getAbreviacao() {
		return abreviacao;
	}

	public void setAbreviacao(String abreviacao) {
		this.abreviacao = abreviacao;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result
				+ ((abreviacao == null) ? 0 : abreviacao.hashCode());
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
		if (!(obj instanceof UnidadeMedida))
			return false;
		UnidadeMedida other = (UnidadeMedida) obj;
		if (abreviacao == null) {
			if (other.abreviacao != null)
				return false;
		} else if (!abreviacao.equals(other.abreviacao))
			return false;
		if (descricao == null) {
			if (other.descricao != null)
				return false;
		} else if (!descricao.equals(other.descricao))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "UnidadeMedida [descricao=" + descricao + ", abreviacao="
				+ abreviacao + ", getId()=" + getId() + "]";
	}

}
