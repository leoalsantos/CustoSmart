package br.com.pjsistemas.app.siscompras.model;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.AttributeOverride;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

import org.hibernate.validator.constraints.NotBlank;

/**
 * Entidade que representa um Produto
 */
@Entity
@AttributeOverride(name = "id", column = @Column(name = "produto_id"))
@Table(uniqueConstraints = @UniqueConstraint(columnNames = { "nome", "codigo" }))
public class Produto extends BaseEntity {

	private static final long serialVersionUID = 2793502630661790578L;

	@NotBlank(message = "Campo obrigatório")
	@Size(min = 4, max = 40, message = "Um produto precisa ter no mínimo 4 caracteres e no máximo 40")
	@Pattern(regexp = "[A-Za-z ]*", message = "Precisa conter apenas letras e espaços")
	private String nome;

	@Size(min = 10, max = 100, message = "Uma descrição deve ter no mínimo 10 caracteres e no máximo 100")
	private String descricao;

	@NotBlank(message = "Campo obrigatório")
	@Size(min = 4, max = 20, message = "Um código deve ter no mínimo 4 caracteres e no máximo 20")
	private String codigo;

	@ManyToOne
	@NotBlank(message = "Campo obrigatório")
	@OrderBy("descricao")
	@JoinColumn(name = "categoria_produto_id")
	private CategoriaProduto categoriaProduto;

	@ManyToOne
	@NotBlank(message = "Campo obrigatório")
	@OrderBy("descricao")
	@JoinColumn(name = "tipo_produto_id")
	private TipoProduto tipoProduto;

	@OneToMany
	@JoinColumn(name = "produto_id")
	private Set<ItemMidia> itemMidia = new HashSet<ItemMidia>();

	@ManyToOne
	@NotBlank(message = "Campo obrigatório")
	@OrderBy("abreviacao")
	@JoinColumn(name = "unidade_medida_id")
	private UnidadeMedida unidadeMedida;

	@ManyToMany
	@OrderBy("nome")
	@JoinTable(name = "produto_fornecedor", joinColumns = { @JoinColumn(name = "produto_id") }, 
		inverseJoinColumns = { @JoinColumn(name = "fornecedor_id") })
	private Set<Fornecedor> fornecedores = new HashSet<Fornecedor>();

	@OneToMany
	@OrderBy("descricao")
	@JoinColumn(name = "produto_id")
	private Set<Imposto> impostos = new HashSet<Imposto>();

	@Column(name = "codigo_barras")
	private Integer codigoBarras;

	@Size(min = 4, max = 100, message = "Um código deve ter no mínimo 4 caracteres e no máximo 100")
	private String caracteristicas;

	@Column(name = "utilizacao_produto")
	private String utilizacaoProduto;

	@Column(name = "procedimentos_recebimento")
	private String procedimentosRecebimento;

	@Column(name = "preco_custo")
	private Double precoCusto;

	@Column(name = "preco_compra")
	private Double precoCompra;

	@Column(name = "preco_medio")
	private Double precoMedio;

	@Column(name = "preco_venda")
	private Double precoVenda;

	@Column(name = "estoque_minimo")
	private Double estoqueMinimo;

	@Column(name = "estoque_maximo")
	private Double estoqueMaximo;

	@Column(name = "consumo_aquisicao")
	private Double consumoAquisicao;

	@Column(name = "consumo_medio")
	private Double consumoMedio;

	@Column(name = "ponto_pedido")
	private Double pontoPedido;

	// Relacionamento @OneToMany
	@ElementCollection
	private List<String> obsevarcoes;

	public Produto() {
		super();
	}

	public Produto(Long id) {
		super(id);
	}

	public Produto(String nome) {
		super();
		this.nome = nome;
	}

	public Produto(String nome, CategoriaProduto categoriaProduto,
			TipoProduto tipoProduto, UnidadeMedida unidadeMedida) {
		super();
		this.nome = nome;
		this.categoriaProduto = categoriaProduto;
		this.tipoProduto = tipoProduto;
		this.unidadeMedida = unidadeMedida;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getDescricao() {
		return descricao;
	}

	public void setDescricao(String descricao) {
		this.descricao = descricao;
	}

	public String getCodigo() {
		return codigo;
	}

	public void setCodigo(String codigo) {
		this.codigo = codigo;
	}

	public CategoriaProduto getCategoriaProduto() {
		return categoriaProduto;
	}

	public void setCategoriaProduto(CategoriaProduto categoriaProduto) {
		this.categoriaProduto = categoriaProduto;
	}

	public TipoProduto getTipoProduto() {
		return tipoProduto;
	}

	public void setTipoProduto(TipoProduto tipoProduto) {
		this.tipoProduto = tipoProduto;
	}
	
	public Set<ItemMidia> getItemMidia() {
		return itemMidia;
	}
	
	public void setItemMidia(Set<ItemMidia> itemMidia) {
		this.itemMidia = itemMidia;
	}

	public UnidadeMedida getUnidadeMedida() {
		return unidadeMedida;
	}

	public void setUnidadeMedida(UnidadeMedida unidadeMedida) {
		this.unidadeMedida = unidadeMedida;
	}

	public Set<Fornecedor> getFornecedores() {
		return fornecedores;
	}

	public void setFornecedores(Set<Fornecedor> fornecedores) {
		this.fornecedores = fornecedores;
	}

	public Set<Imposto> getImpostos() {
		return impostos;
	}

	public void setImpostos(Set<Imposto> impostos) {
		this.impostos = impostos;
	}

	public Integer getCodigoBarras() {
		return codigoBarras;
	}

	public void setCodigoBarras(Integer codigoBarras) {
		this.codigoBarras = codigoBarras;
	}

	public String getCaracteristicas() {
		return caracteristicas;
	}

	public void setCaracteristicas(String caracteristicas) {
		this.caracteristicas = caracteristicas;
	}

	public String getUtilizacaoProduto() {
		return utilizacaoProduto;
	}

	public void setUtilizacaoProduto(String utilizacaoProduto) {
		this.utilizacaoProduto = utilizacaoProduto;
	}

	public String getProcedimentosRecebimento() {
		return procedimentosRecebimento;
	}

	public void setProcedimentosRecebimento(String procedimentosRecebimento) {
		this.procedimentosRecebimento = procedimentosRecebimento;
	}

	public Double getPrecoCusto() {
		return precoCusto;
	}

	public void setPrecoCusto(Double precoCusto) {
		this.precoCusto = precoCusto;
	}

	public Double getPrecoCompra() {
		return precoCompra;
	}

	public void setPrecoCompra(Double precoCompra) {
		this.precoCompra = precoCompra;
	}

	public Double getPrecoMedio() {
		return precoMedio;
	}

	public void setPrecoMedio(Double precoMedio) {
		this.precoMedio = precoMedio;
	}

	public Double getPrecoVenda() {
		return precoVenda;
	}

	public void setPrecoVenda(Double precoVenda) {
		this.precoVenda = precoVenda;
	}

	public Double getEstoqueMinimo() {
		return estoqueMinimo;
	}

	public void setEstoqueMinimo(Double estoqueMinimo) {
		this.estoqueMinimo = estoqueMinimo;
	}

	public Double getEstoqueMaximo() {
		return estoqueMaximo;
	}

	public void setEstoqueMaximo(Double estoqueMaximo) {
		this.estoqueMaximo = estoqueMaximo;
	}

	public Double getConsumoAquisicao() {
		return consumoAquisicao;
	}

	public void setConsumoAquisicao(Double consumoAquisicao) {
		this.consumoAquisicao = consumoAquisicao;
	}

	public Double getConsumoMedio() {
		return consumoMedio;
	}

	public void setConsumoMedio(Double consumoMedio) {
		this.consumoMedio = consumoMedio;
	}

	public Double getPontoPedido() {
		return pontoPedido;
	}

	public void setPontoPedido(Double pontoPedido) {
		this.pontoPedido = pontoPedido;
	}

	public List<String> getObsevarcoes() {
		return obsevarcoes;
	}

	public void setObsevarcoes(List<String> obsevarcoes) {
		this.obsevarcoes = obsevarcoes;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
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
		Produto other = (Produto) obj;
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
		return "Produto [nome=" + nome + ", categoriaProduto="
				+ categoriaProduto + ", tipoProduto=" + tipoProduto
				+ ", unidadeMedida=" + unidadeMedida + "]";
	}

}