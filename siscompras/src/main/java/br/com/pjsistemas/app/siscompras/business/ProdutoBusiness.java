package br.com.pjsistemas.app.siscompras.business;

import javax.ejb.Local;

import br.com.pjsistemas.app.siscompras.model.Produto;

/**
 * Interface local para o Business da entidade {@link Produto}.
 */
@Local
public interface ProdutoBusiness {

	/**
	 * Método para salvar um {@link Produto}
	 * @param produto a ser salvo
	 */
	void salvarProduto(Produto produto);

}
