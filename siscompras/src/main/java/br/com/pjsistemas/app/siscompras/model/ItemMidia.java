package br.com.pjsistemas.app.siscompras.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

@Entity
public class ItemMidia extends BaseEntity {

	/**
	 * Serial.
	 */
	private static final long serialVersionUID = -553722848141588532L;

	@Enumerated(EnumType.STRING)
	@Column(name = "tipo_midia")
	private TipoMidia tipoMidia;

	@URL
	@NotBlank
	@Column(unique = true)
	private String url;
	
	public ItemMidia() {
		super();
	}

	public ItemMidia(Long id) {
		super(id);
	}

	public ItemMidia(String url) {
		super();
		this.url = url;
	}

	public TipoMidia getTipoMidia() {
		return tipoMidia;
	}

	public void setTipoMidia(TipoMidia tipoMidia) {
		this.tipoMidia = tipoMidia;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((url == null) ? 0 : url.hashCode());
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
		ItemMidia other = (ItemMidia) obj;
		if (url == null) {
			if (other.url != null)
				return false;
		} else if (!url.equals(other.url))
			return false;
		return true;
	}

	@Override
	public String toString() {
		return "ItemMidia [tipoMidia=" + tipoMidia + ", url=" + url
				+ ", getId()=" + getId() + "]";
	}

}
