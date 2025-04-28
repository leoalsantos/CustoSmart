package br.com.pjsistemas.app.siscompras.model;

import java.io.Serializable;

import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.MappedSuperclass;
import javax.persistence.Version;

@MappedSuperclass
public abstract class BaseEntity implements Serializable {

	/**
	 * Serial.
	 */
	private static final long serialVersionUID = 8832748759342302799L;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private final Long id;

	@Version
	private int versao;

	public BaseEntity() {
		this.id = null;
	}

	public BaseEntity(Long id) {
		super();
		this.id = id;
	}

	public Long getId() {
		return id;
	}

	public int getVersao() {
		return versao;
	}

	public final boolean isPersistido() {
		return id != null;
	}

	@Override
	public abstract int hashCode();

	@Override
	public abstract boolean equals(Object obj);

	@Override
	public String toString() {
		return "BaseEntity [id=" + id + ", versao=" + versao + "]";
	}

}
