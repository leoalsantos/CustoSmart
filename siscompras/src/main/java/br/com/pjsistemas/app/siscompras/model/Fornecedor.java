package br.com.pjsistemas.app.siscompras.model;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.AttributeOverride;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToMany;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.Valid;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import org.hibernate.validator.constraints.Email;
import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.NotEmpty;

@Entity
@AttributeOverride(name = "id", column = @Column(name = "fornecedor_id"))
@Table(uniqueConstraints = @UniqueConstraint(columnNames = { "nome", "codigo", "cnpj" }))
public class Fornecedor extends BaseEntity {

	private static final long serialVersionUID = -7357114428227311240L;

	@NotBlank(message = "Campo obrigatório")
	@Size(min = 5, max = 40, message = "Um fornecedor precisa ter no mínimo 5 caracteres, e no máximo 40 caracteres")
	@Pattern(regexp = "[A-Za-z ]*", message = "Precisa conter apenas letras e espaços")
	private String nome;

	@NotBlank(message = "Campo obrigatório")
	@Size(min = 4, max = 20, message = "Um código deve ter no mínimo 4 caracteres e no máximo 20")
	private String codigo;

	private String razaoSocial;

	@Embedded
	private Endereco endereco = new Endereco();

	private String contato;

	@OneToMany(mappedBy = "fornecedor", cascade = CascadeType.ALL)
	private Set<Telefone> telefones = new HashSet<Telefone>();

	@Email
	private String email;

	@NotBlank(message = "Campo obrigatório")
	private String cnpj;

	private String inscricaoEstadual;

	private String inscricaoMunicipal;

	private String tipoPagamento;

	// @OneToMany
	@ElementCollection
	private List<String> obsevarcoes;
	
	@ManyToMany(mappedBy = "fornecedores")
	private List<Produto> produtos;

	@OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
	@JoinColumn
	@NotEmpty
	@Valid
	private Set<CondicaoPagamento> condicaoPagamento;

	public Fornecedor() {
		super();
	}

	public Fornecedor(Long id) {
		super(id);
	}

	public Fornecedor(String nome) {
		super();
		this.nome = nome;
	}

	public Fornecedor(String nome, String codigo, String cnpj) {
		super();
		this.nome = nome;
		this.codigo = codigo;
		this.cnpj = cnpj;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getCodigo() {
		return codigo;
	}

	public void setCodigo(String codigo) {
		this.codigo = codigo;
	}

	public String getRazaoSocial() {
		return razaoSocial;
	}

	public void setRazaoSocial(String razaoSocial) {
		this.razaoSocial = razaoSocial;
	}

	public Endereco getEndereco() {
		return endereco;
	}

	public void setEndereco(Endereco endereco) {
		this.endereco = endereco;
	}

	public String getContato() {
		return contato;
	}

	public void setContato(String contato) {
		this.contato = contato;
	}

	public Set<Telefone> getTelefones() {
		return telefones;
	}

	public void setTelefones(Set<Telefone> telefones) {
		this.telefones = telefones;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getCnpj() {
		return cnpj;
	}

	public void setCnpj(String cnpj) {
		this.cnpj = cnpj;
	}

	public String getInscricaoEstadual() {
		return inscricaoEstadual;
	}

	public void setInscricaoEstadual(String inscricaoEstadual) {
		this.inscricaoEstadual = inscricaoEstadual;
	}

	public String getInscricaoMunicipal() {
		return inscricaoMunicipal;
	}

	public void setInscricaoMunicipal(String inscricaoMunicipal) {
		this.inscricaoMunicipal = inscricaoMunicipal;
	}

	public String getTipoPagamento() {
		return tipoPagamento;
	}

	public void setTipoPagamento(String tipoPagamento) {
		this.tipoPagamento = tipoPagamento;
	}

	public List<String> getObsevarcoes() {
		return obsevarcoes;
	}
	
	public void setObsevarcoes(List<String> obsevarcoes) {
		this.obsevarcoes = obsevarcoes;
	}
	
	public List<Produto> getProdutos() {
		return produtos;
	}

	public void setProdutos(List<Produto> produtos) {
		this.produtos = produtos;
	}

	public Set<CondicaoPagamento> getCondicaoPagamento() {
		return condicaoPagamento;
	}

	public void setCondicaoPagamento(Set<CondicaoPagamento> condicaoPagamento) {
		this.condicaoPagamento = condicaoPagamento;
	}
	
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((cnpj == null) ? 0 : cnpj.hashCode());
		result = prime * result + ((codigo == null) ? 0 : codigo.hashCode());
		result = prime * result + ((nome == null) ? 0 : nome.hashCode());
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
		Fornecedor other = (Fornecedor) obj;
		if (cnpj == null) {
			if (other.cnpj != null)
				return false;
		} else if (!cnpj.equals(other.cnpj))
			return false;
		if (codigo == null) {
			if (other.codigo != null)
				return false;
		} else if (!codigo.equals(other.codigo))
			return false;
		if (nome == null) {
			if (other.nome != null)
				return false;
		} else if (!nome.equals(other.nome))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "Fornecedor [nome=" + nome + ", codigo=" + codigo + ", cnpj="
				+ cnpj + "]";
	}

}
