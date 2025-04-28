/**
 *
 */
package br.com.pjsistemas.app.siscompras.facade;

import java.util.List;

import javax.ejb.Local;

import br.com.pjsistemas.app.siscompras.model.Produto;

/**
 * Interface local para a Facade do ECU Manter Produtos.
 *
 */
@Local
public interface ManterProdutoFacade {

	/**
	 * Método para salvar um produto.
	 * @param produto a ser salvo
	 */
	void salvarProduto(Produto produto);

	List<Produto> selecionarProdutos();
}
