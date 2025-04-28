/**
 *
 */
package br.com.pjsistemas.app.siscompras.business.impl;

import java.util.logging.Logger;

import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.persistence.EntityManager;

import br.com.pjsistemas.app.siscompras.business.ProdutoBusiness;
import br.com.pjsistemas.app.siscompras.model.Produto;

/**
 * Implementação Business da entidade {@link Produto}.
 *
 */
@Stateless
public class ProbutoBusinessBean implements ProdutoBusiness {

	@Inject
	private EntityManager entityManager;

	@Inject
	private Logger log;

	@Override
	public void salvarProduto(Produto produto) {
		if(produto.isPersistido()) {
			log.info("Alterando Produto: " + produto.getNome());
			entityManager.merge(produto);
		} else {
			log.info("Incluindo Produto: " + produto.getNome());
			entityManager.persist(produto);
		}
	}

}
