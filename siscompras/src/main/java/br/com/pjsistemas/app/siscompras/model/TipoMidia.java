package br.com.pjsistemas.app.siscompras.model;

public enum TipoMidia {

	IMAGEM("Imagem", true), 
	VIDEO("Video", true);

	private final String descricao;

	private final boolean cacheavel;

	private TipoMidia(String descricao, boolean cacheavel) {
		this.descricao = descricao;
		this.cacheavel = cacheavel;
	}

	public String getDescricao() {
		return descricao;
	}

	public boolean isCacheavel() {
		return cacheavel;
	}

}
