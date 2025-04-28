/**
 *
 */
package br.com.pjsistemas.app.siscompras.facade.impl;

import java.util.List;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;

import br.com.pjsistemas.app.siscompras.business.ProdutoBusiness;
import br.com.pjsistemas.app.siscompras.facade.ManterProdutoFacade;
import br.com.pjsistemas.app.siscompras.model.Produto;

/**
 * Implementação EJB facade para as chamadas de view do ECU Manter Produtos.
 */
@Stateless
public class ManterProdutoFacadeBean implements ManterProdutoFacade {

	@Inject
	private Event<Produto> produtoEventSrc;

	/**
	 * {@link ProdutoBusiness}
	 */
	@EJB
	private ProdutoBusiness produtoBusiness;

	@Override
	public void salvarProduto(Produto produto) {
		produtoBusiness.salvarProduto(produto);
		produtoEventSrc.fire(produto);
	}

	@Override
	public List<Produto> selecionarProdutos() {
		// TODO Auto-generated method stub
		return null;
	}

}
