/**
 *
 */
package br.com.pjsistemas.app.siscompras.view;

import java.io.Serializable;
import java.util.List;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ConversationScoped;
import javax.enterprise.inject.Produces;
import javax.faces.application.FacesMessage;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import javax.inject.Named;

import br.com.pjsistemas.app.siscompras.facade.ManterProdutoFacade;
import br.com.pjsistemas.app.siscompras.model.Produto;

/**
 * View para o cadastro de {@link Produto}
 */
@Named("manterProdutoBean")
@ConversationScoped
public class ManterProdutoBean implements Serializable {

	/**
	 * Serial.
	 */
	private static final long serialVersionUID = -8482479271582213787L;

	@Inject
	private FacesContext facesContext;

	/**
	 * {@link Produto} sendo incluido ou editado.
	 */
	@Produces
	@Named
	private Produto produtoNovo;

	@Inject
	private ManterProdutoFacade manterProdutoFacade;

	// verificar se sai da classe
	public String novo() {
		this.produtoNovo = new Produto();
		return "null";
	}

	@PostConstruct
	public void initProdutoNovo() {
		produtoNovo = new Produto();
	}

	public void salvar() throws Exception {
		try {
			manterProdutoFacade.salvarProduto(produtoNovo);
			final FacesMessage m = new FacesMessage(FacesMessage.SEVERITY_INFO,
					"Registered!", "Registration successful");
			facesContext.addMessage(null, m);
			initProdutoNovo();
		} catch (final Exception e) {
			final String errorMessage = getRootErrorMessage(e);
			final FacesMessage m = new FacesMessage(
					FacesMessage.SEVERITY_ERROR, errorMessage,
					"Registration unsuccessful");
			facesContext.addMessage(null, m);
		}
	}

	private String getRootErrorMessage(Exception e) {
		// Default to general error message that registration failed.
		String errorMessage = "Registration failed. See server log for more information";
		if (e == null) {
			// This shouldn't happen, but return the default messages
			return errorMessage;
		}
		// Start with the exception and recurse to find the root cause
		Throwable t = e;
		while (t != null) {
			// Get the message from the Throwable class instance
			errorMessage = t.getLocalizedMessage();
			t = t.getCause();
		}
		// This is the root cause message
		return errorMessage;
	}

	@Produces
	@Named
	public List<Produto> getProdutos() {
		final List<Produto> produtos = manterProdutoFacade.selecionarProdutos();

		return produtos;
	}

}
