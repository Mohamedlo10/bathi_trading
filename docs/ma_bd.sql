-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cbm (
  id integer NOT NULL DEFAULT nextval('cbm_id_seq'::regclass),
  prix_cbm numeric NOT NULL CHECK (prix_cbm > 0::numeric),
  date_debut_validite date NOT NULL DEFAULT CURRENT_DATE,
  date_fin_validite date,
  is_valid boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT cbm_pkey PRIMARY KEY (id)
);
CREATE TABLE public.client (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name character varying NOT NULL,
  telephone character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT client_pkey PRIMARY KEY (id)
);
CREATE TABLE public.colis (
  id integer NOT NULL DEFAULT nextval('colis_id_seq'::regclass),
  id_client uuid NOT NULL,
  id_container integer NOT NULL,
  description text,
  nb_pieces integer NOT NULL CHECK (nb_pieces > 0),
  poids numeric NOT NULL CHECK (poids > 0::numeric),
  cbm numeric NOT NULL CHECK (cbm > 0::numeric),
  prix_cbm_id integer NOT NULL,
  montant numeric NOT NULL CHECK (montant >= 0::numeric),
  statut character varying DEFAULT 'non_paye'::character varying CHECK (statut::text = ANY (ARRAY['non_paye'::character varying, 'partiellement_paye'::character varying, 'paye'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT colis_pkey PRIMARY KEY (id),
  CONSTRAINT colis_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.client(id),
  CONSTRAINT colis_id_container_fkey FOREIGN KEY (id_container) REFERENCES public.container(id),
  CONSTRAINT colis_prix_cbm_id_fkey FOREIGN KEY (prix_cbm_id) REFERENCES public.cbm(id)
);
CREATE TABLE public.container (
  id integer NOT NULL DEFAULT nextval('container_id_seq'::regclass),
  nom character varying NOT NULL,
  numero_conteneur character varying NOT NULL UNIQUE,
  pays_origine_id integer,
  type_conteneur character varying DEFAULT '40pieds'::character varying CHECK (type_conteneur::text = ANY (ARRAY['20pieds'::character varying, '40pieds'::character varying]::text[])),
  date_arrivee date,
  date_chargement date NOT NULL,
  compagnie_transit character varying,
  total_cbm numeric DEFAULT 0 CHECK (total_cbm >= 0::numeric AND total_cbm <= 70::numeric),
  total_ca numeric DEFAULT 0 CHECK (total_ca >= 0::numeric),
  created_at timestamp without time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT container_pkey PRIMARY KEY (id),
  CONSTRAINT container_pays_origine_id_fkey FOREIGN KEY (pays_origine_id) REFERENCES public.pays(id)
);
CREATE TABLE public.pays (
  id integer NOT NULL DEFAULT nextval('pays_id_seq'::regclass),
  code character varying NOT NULL UNIQUE,
  nom character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT pays_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_uid uuid UNIQUE,
  full_name character varying NOT NULL,
  telephone character varying,
  email character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  role character varying DEFAULT 'admin'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying, 'user'::character varying]::text[])),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_uid_fkey FOREIGN KEY (auth_uid) REFERENCES auth.users(id)
);