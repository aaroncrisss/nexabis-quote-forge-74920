--
-- PostgreSQL database dump
--

\restrict ZhH7Z1AjiCXY0Ve3IyRXAIbWctg5yncdUTweItJ4CTJadLNoNToeVOvYdCjYOzg

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP EVENT TRIGGER IF EXISTS pgrst_drop_watch;
DROP EVENT TRIGGER IF EXISTS pgrst_ddl_watch;
DROP EVENT TRIGGER IF EXISTS issue_pg_net_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_graphql_access;
DROP EVENT TRIGGER IF EXISTS issue_pg_cron_access;
DROP EVENT TRIGGER IF EXISTS issue_graphql_placeholder;
DROP PUBLICATION IF EXISTS supabase_realtime;
DROP POLICY IF EXISTS "Users can view own documentos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documentos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio rol" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own projets" ON public.proyectos;
DROP POLICY IF EXISTS "Users can view own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own presupuestos" ON public.presupuestos;
DROP POLICY IF EXISTS "Users can view own pipeline_etapas" ON public.pipeline_etapas;
DROP POLICY IF EXISTS "Users can view own pagos" ON public.pagos;
DROP POLICY IF EXISTS "Users can view own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notificaciones;
DROP POLICY IF EXISTS "Users can view own notas_cliente" ON public.notas_cliente;
DROP POLICY IF EXISTS "Users can view own facturas" ON public.facturas;
DROP POLICY IF EXISTS "Users can view own etiquetas" ON public.etiquetas;
DROP POLICY IF EXISTS "Users can view own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can view own contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users can view own clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can view own cliente_etiquetas" ON public.cliente_etiquetas;
DROP POLICY IF EXISTS "Users can view own AI logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Users can view modules of their estimations" ON public.modulos_estimacion;
DROP POLICY IF EXISTS "Users can view items of own presupuestos" ON public.items_presupuesto;
DROP POLICY IF EXISTS "Users can view items of own facturas" ON public.items_factura;
DROP POLICY IF EXISTS "Users can view items of accessible presupuestos" ON public.items_presupuesto;
DROP POLICY IF EXISTS "Users can view estimaciones of their projects" ON public.estimaciones;
DROP POLICY IF EXISTS "Users can update their own projets" ON public.proyectos;
DROP POLICY IF EXISTS "Users can update own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own presupuestos" ON public.presupuestos;
DROP POLICY IF EXISTS "Users can update own pipeline_etapas" ON public.pipeline_etapas;
DROP POLICY IF EXISTS "Users can update own pagos" ON public.pagos;
DROP POLICY IF EXISTS "Users can update own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notificaciones;
DROP POLICY IF EXISTS "Users can update own facturas" ON public.facturas;
DROP POLICY IF EXISTS "Users can update own etiquetas" ON public.etiquetas;
DROP POLICY IF EXISTS "Users can update own contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can update modules of their estimations" ON public.modulos_estimacion;
DROP POLICY IF EXISTS "Users can update items of own presupuestos" ON public.items_presupuesto;
DROP POLICY IF EXISTS "Users can update items of own facturas" ON public.items_factura;
DROP POLICY IF EXISTS "Users can update estimaciones of their projects" ON public.estimaciones;
DROP POLICY IF EXISTS "Users can insert their own projets" ON public.proyectos;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert modules to their estimations" ON public.modulos_estimacion;
DROP POLICY IF EXISTS "Users can insert estimaciones to their projects" ON public.estimaciones;
DROP POLICY IF EXISTS "Users can delete their own projets" ON public.proyectos;
DROP POLICY IF EXISTS "Users can delete own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can delete own presupuestos" ON public.presupuestos;
DROP POLICY IF EXISTS "Users can delete own pipeline_etapas" ON public.pipeline_etapas;
DROP POLICY IF EXISTS "Users can delete own pagos" ON public.pagos;
DROP POLICY IF EXISTS "Users can delete own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can delete own notas_cliente" ON public.notas_cliente;
DROP POLICY IF EXISTS "Users can delete own facturas" ON public.facturas;
DROP POLICY IF EXISTS "Users can delete own etiquetas" ON public.etiquetas;
DROP POLICY IF EXISTS "Users can delete own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can delete own contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can delete own cliente_etiquetas" ON public.cliente_etiquetas;
DROP POLICY IF EXISTS "Users can delete modules of their estimations" ON public.modulos_estimacion;
DROP POLICY IF EXISTS "Users can delete items of own presupuestos" ON public.items_presupuesto;
DROP POLICY IF EXISTS "Users can delete items of own facturas" ON public.items_factura;
DROP POLICY IF EXISTS "Users can delete estimaciones of their projects" ON public.estimaciones;
DROP POLICY IF EXISTS "Users can create own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can create own presupuestos" ON public.presupuestos;
DROP POLICY IF EXISTS "Users can create own pipeline_etapas" ON public.pipeline_etapas;
DROP POLICY IF EXISTS "Users can create own pagos" ON public.pagos;
DROP POLICY IF EXISTS "Users can create own oportunidades" ON public.oportunidades;
DROP POLICY IF EXISTS "Users can create own notas_cliente" ON public.notas_cliente;
DROP POLICY IF EXISTS "Users can create own facturas" ON public.facturas;
DROP POLICY IF EXISTS "Users can create own etiquetas" ON public.etiquetas;
DROP POLICY IF EXISTS "Users can create own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can create own contratos" ON public.contratos;
DROP POLICY IF EXISTS "Users can create own clients" ON public.clientes;
DROP POLICY IF EXISTS "Users can create own cliente_etiquetas" ON public.cliente_etiquetas;
DROP POLICY IF EXISTS "Users can create items for own presupuestos" ON public.items_presupuesto;
DROP POLICY IF EXISTS "Users can create items for own facturas" ON public.items_factura;
DROP POLICY IF EXISTS "Todos pueden ver promociones activas" ON public.promociones;
DROP POLICY IF EXISTS "System can insert AI logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Solo admins pueden ver usuarios permitidos" ON public.usuarios_permitidos;
DROP POLICY IF EXISTS "Solo admins pueden gestionar promociones" ON public.promociones;
DROP POLICY IF EXISTS "Solo admins pueden eliminar usuarios permitidos" ON public.usuarios_permitidos;
DROP POLICY IF EXISTS "Solo admins pueden eliminar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Solo admins pueden asignar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Solo admins pueden agregar usuarios permitidos" ON public.usuarios_permitidos;
DROP POLICY IF EXISTS "Solo admins pueden actualizar usuarios permitidos" ON public.usuarios_permitidos;
DROP POLICY IF EXISTS "Solo admins pueden actualizar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can view profiles via presupuesto" ON public.profiles;
DROP POLICY IF EXISTS "Public can view presupuesto by valid token" ON public.presupuestos;
DROP POLICY IF EXISTS "Public can view clientes via presupuesto" ON public.clientes;
DROP POLICY IF EXISTS "Permitir inserts públicos" ON public.posibles_clientes;
DROP POLICY IF EXISTS "Anonymous can view presupuesto by token check" ON public.presupuestos;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_upload_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_bucket_id_fkey;
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS "objects_bucketId_fkey";
ALTER TABLE IF EXISTS ONLY public.usuarios_permitidos DROP CONSTRAINT IF EXISTS usuarios_permitidos_invitado_por_fkey;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tareas DROP CONSTRAINT IF EXISTS tareas_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tareas DROP CONSTRAINT IF EXISTS tareas_proyecto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tareas DROP CONSTRAINT IF EXISTS tareas_oportunidad_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tareas DROP CONSTRAINT IF EXISTS tareas_modulo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tareas DROP CONSTRAINT IF EXISTS tareas_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proyectos DROP CONSTRAINT IF EXISTS proyectos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.proyectos DROP CONSTRAINT IF EXISTS proyectos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_equipo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.presupuestos DROP CONSTRAINT IF EXISTS presupuestos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.presupuestos DROP CONSTRAINT IF EXISTS presupuestos_proyecto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.presupuestos DROP CONSTRAINT IF EXISTS presupuestos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pipeline_etapas DROP CONSTRAINT IF EXISTS pipeline_etapas_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_presupuesto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_etapa_id_fkey;
ALTER TABLE IF EXISTS ONLY public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_presupuesto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notas_cliente DROP CONSTRAINT IF EXISTS notas_cliente_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notas_cliente DROP CONSTRAINT IF EXISTS notas_cliente_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.modulos_estimacion DROP CONSTRAINT IF EXISTS modulos_estimacion_estimacion_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items_presupuesto DROP CONSTRAINT IF EXISTS items_presupuesto_presupuesto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.items_factura DROP CONSTRAINT IF EXISTS items_factura_factura_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS fk_pagos_factura;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_presupuesto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.etiquetas DROP CONSTRAINT IF EXISTS etiquetas_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.estimaciones DROP CONSTRAINT IF EXISTS estimaciones_proyecto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.equipos DROP CONSTRAINT IF EXISTS equipos_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY public.equipo_miembros DROP CONSTRAINT IF EXISTS equipo_miembros_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.equipo_miembros DROP CONSTRAINT IF EXISTS equipo_miembros_equipo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documentos DROP CONSTRAINT IF EXISTS documentos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documentos DROP CONSTRAINT IF EXISTS documentos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.clientes DROP CONSTRAINT IF EXISTS clientes_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cliente_etiquetas DROP CONSTRAINT IF EXISTS cliente_etiquetas_etiqueta_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cliente_etiquetas DROP CONSTRAINT IF EXISTS cliente_etiquetas_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_flow_state_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_sso_provider_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_user_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_auth_factor_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_fkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_user_id_fkey;
ALTER TABLE IF EXISTS ONLY _realtime.extensions DROP CONSTRAINT IF EXISTS extensions_tenant_external_id_fkey;
DROP TRIGGER IF EXISTS update_objects_updated_at ON storage.objects;
DROP TRIGGER IF EXISTS tr_check_filters ON realtime.subscription;
DROP TRIGGER IF EXISTS update_tareas_updated_at ON public.tareas;
DROP TRIGGER IF EXISTS update_promociones_updated_at ON public.promociones;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_presupuestos_updated_at ON public.presupuestos;
DROP TRIGGER IF EXISTS update_pagos_updated_at ON public.pagos;
DROP TRIGGER IF EXISTS update_oportunidades_updated_at ON public.oportunidades;
DROP TRIGGER IF EXISTS update_facturas_updated_at ON public.facturas;
DROP TRIGGER IF EXISTS update_contratos_updated_at ON public.contratos;
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
DROP TRIGGER IF EXISTS tr_sync_task_status ON public.tareas;
DROP TRIGGER IF EXISTS tr_sync_modulo_status ON public.modulos_estimacion;
DROP TRIGGER IF EXISTS on_budget_status_update ON public.presupuestos;
DROP TRIGGER IF EXISTS generate_presupuesto_number ON public.presupuestos;
DROP TRIGGER IF EXISTS generate_factura_number ON public.facturas;
DROP TRIGGER IF EXISTS calculate_presupuesto_vencimiento ON public.presupuestos;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP INDEX IF EXISTS supabase_functions.supabase_functions_hooks_request_id_idx;
DROP INDEX IF EXISTS supabase_functions.supabase_functions_hooks_h_table_id_h_name_idx;
DROP INDEX IF EXISTS storage.name_prefix_search;
DROP INDEX IF EXISTS storage.idx_objects_bucket_id_name;
DROP INDEX IF EXISTS storage.idx_multipart_uploads_list;
DROP INDEX IF EXISTS storage.bucketid_objname;
DROP INDEX IF EXISTS storage.bname;
DROP INDEX IF EXISTS realtime.subscription_subscription_id_entity_filters_key;
DROP INDEX IF EXISTS realtime.ix_realtime_subscription_entity;
DROP INDEX IF EXISTS public.idx_user_roles_user_id;
DROP INDEX IF EXISTS public.idx_tareas_usuario_id;
DROP INDEX IF EXISTS public.idx_tareas_fecha_vencimiento;
DROP INDEX IF EXISTS public.idx_tareas_estado;
DROP INDEX IF EXISTS public.idx_tareas_cliente_id;
DROP INDEX IF EXISTS public.idx_profiles_subscription_tier;
DROP INDEX IF EXISTS public.idx_profiles_subscription_status;
DROP INDEX IF EXISTS public.idx_presupuestos_usuario_id;
DROP INDEX IF EXISTS public.idx_presupuestos_token;
DROP INDEX IF EXISTS public.idx_presupuestos_proyecto_id;
DROP INDEX IF EXISTS public.idx_presupuestos_numero;
DROP INDEX IF EXISTS public.idx_presupuestos_estado;
DROP INDEX IF EXISTS public.idx_presupuestos_cliente_id;
DROP INDEX IF EXISTS public.idx_pipeline_etapas_usuario_id;
DROP INDEX IF EXISTS public.idx_pipeline_etapas_orden;
DROP INDEX IF EXISTS public.idx_pagos_usuario_id;
DROP INDEX IF EXISTS public.idx_pagos_fecha;
DROP INDEX IF EXISTS public.idx_pagos_estado;
DROP INDEX IF EXISTS public.idx_pagos_cliente_id;
DROP INDEX IF EXISTS public.idx_oportunidades_usuario_id;
DROP INDEX IF EXISTS public.idx_oportunidades_etapa_id;
DROP INDEX IF EXISTS public.idx_oportunidades_estado;
DROP INDEX IF EXISTS public.idx_oportunidades_cliente_id;
DROP INDEX IF EXISTS public.idx_notificaciones_visto;
DROP INDEX IF EXISTS public.idx_notificaciones_usuario_id;
DROP INDEX IF EXISTS public.idx_notas_cliente_cliente_id;
DROP INDEX IF EXISTS public.idx_items_presupuesto_presupuesto_id;
DROP INDEX IF EXISTS public.idx_items_factura_factura_id;
DROP INDEX IF EXISTS public.idx_facturas_usuario_id;
DROP INDEX IF EXISTS public.idx_facturas_numero;
DROP INDEX IF EXISTS public.idx_facturas_estado;
DROP INDEX IF EXISTS public.idx_facturas_cliente_id;
DROP INDEX IF EXISTS public.idx_documentos_cliente_id;
DROP INDEX IF EXISTS public.idx_contratos_usuario_id;
DROP INDEX IF EXISTS public.idx_contratos_estado;
DROP INDEX IF EXISTS public.idx_contratos_cliente_id;
DROP INDEX IF EXISTS public.idx_clientes_usuario_id;
DROP INDEX IF EXISTS public.idx_clientes_fuente;
DROP INDEX IF EXISTS public.idx_clientes_etapa_ciclo;
DROP INDEX IF EXISTS public.idx_clientes_email;
DROP INDEX IF EXISTS public.idx_cliente_etiquetas_etiqueta;
DROP INDEX IF EXISTS public.idx_cliente_etiquetas_cliente;
DROP INDEX IF EXISTS public.idx_ai_usage_usuario_id;
DROP INDEX IF EXISTS public.idx_ai_usage_created_at;
DROP INDEX IF EXISTS auth.users_is_anonymous_idx;
DROP INDEX IF EXISTS auth.users_instance_id_idx;
DROP INDEX IF EXISTS auth.users_instance_id_email_idx;
DROP INDEX IF EXISTS auth.users_email_partial_key;
DROP INDEX IF EXISTS auth.user_id_created_at_idx;
DROP INDEX IF EXISTS auth.unique_phone_factor_per_user;
DROP INDEX IF EXISTS auth.sso_providers_resource_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.sso_domains_domain_idx;
DROP INDEX IF EXISTS auth.sessions_user_id_idx;
DROP INDEX IF EXISTS auth.sessions_not_after_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_for_email_idx;
DROP INDEX IF EXISTS auth.saml_relay_states_created_at_idx;
DROP INDEX IF EXISTS auth.saml_providers_sso_provider_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_updated_at_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_session_id_revoked_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_parent_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_user_id_idx;
DROP INDEX IF EXISTS auth.refresh_tokens_instance_id_idx;
DROP INDEX IF EXISTS auth.recovery_token_idx;
DROP INDEX IF EXISTS auth.reauthentication_token_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_user_id_token_type_key;
DROP INDEX IF EXISTS auth.one_time_tokens_token_hash_hash_idx;
DROP INDEX IF EXISTS auth.one_time_tokens_relates_to_hash_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_id_idx;
DROP INDEX IF EXISTS auth.mfa_factors_user_friendly_name_unique;
DROP INDEX IF EXISTS auth.mfa_challenge_created_at_idx;
DROP INDEX IF EXISTS auth.idx_user_id_auth_method;
DROP INDEX IF EXISTS auth.idx_auth_code;
DROP INDEX IF EXISTS auth.identities_user_id_idx;
DROP INDEX IF EXISTS auth.identities_email_idx;
DROP INDEX IF EXISTS auth.flow_state_created_at_idx;
DROP INDEX IF EXISTS auth.factor_id_created_at_idx;
DROP INDEX IF EXISTS auth.email_change_token_new_idx;
DROP INDEX IF EXISTS auth.email_change_token_current_idx;
DROP INDEX IF EXISTS auth.confirmation_token_idx;
DROP INDEX IF EXISTS auth.audit_logs_instance_id_idx;
DROP INDEX IF EXISTS _realtime.tenants_external_id_index;
DROP INDEX IF EXISTS _realtime.extensions_tenant_external_id_type_index;
DROP INDEX IF EXISTS _realtime.extensions_tenant_external_id_index;
ALTER TABLE IF EXISTS ONLY supabase_functions.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY supabase_functions.hooks DROP CONSTRAINT IF EXISTS hooks_pkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads DROP CONSTRAINT IF EXISTS s3_multipart_uploads_pkey;
ALTER TABLE IF EXISTS ONLY storage.s3_multipart_uploads_parts DROP CONSTRAINT IF EXISTS s3_multipart_uploads_parts_pkey;
ALTER TABLE IF EXISTS ONLY storage.objects DROP CONSTRAINT IF EXISTS objects_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_pkey;
ALTER TABLE IF EXISTS ONLY storage.migrations DROP CONSTRAINT IF EXISTS migrations_name_key;
ALTER TABLE IF EXISTS ONLY storage.buckets DROP CONSTRAINT IF EXISTS buckets_pkey;
ALTER TABLE IF EXISTS ONLY realtime.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY realtime.subscription DROP CONSTRAINT IF EXISTS pk_subscription;
ALTER TABLE IF EXISTS ONLY realtime.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios_permitidos DROP CONSTRAINT IF EXISTS usuarios_permitidos_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios_permitidos DROP CONSTRAINT IF EXISTS usuarios_permitidos_email_key;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE IF EXISTS ONLY public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE IF EXISTS ONLY public.tareas DROP CONSTRAINT IF EXISTS tareas_pkey;
ALTER TABLE IF EXISTS ONLY public.proyectos DROP CONSTRAINT IF EXISTS proyectos_pkey;
ALTER TABLE IF EXISTS ONLY public.promociones DROP CONSTRAINT IF EXISTS promociones_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.presupuestos DROP CONSTRAINT IF EXISTS presupuestos_pkey;
ALTER TABLE IF EXISTS ONLY public.posibles_clientes DROP CONSTRAINT IF EXISTS posibles_clientes_pkey;
ALTER TABLE IF EXISTS ONLY public.pipeline_etapas DROP CONSTRAINT IF EXISTS pipeline_etapas_pkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_pkey;
ALTER TABLE IF EXISTS ONLY public.oportunidades DROP CONSTRAINT IF EXISTS oportunidades_pkey;
ALTER TABLE IF EXISTS ONLY public.notificaciones DROP CONSTRAINT IF EXISTS notificaciones_pkey;
ALTER TABLE IF EXISTS ONLY public.notas_cliente DROP CONSTRAINT IF EXISTS notas_cliente_pkey;
ALTER TABLE IF EXISTS ONLY public.newsletter_nexabis DROP CONSTRAINT IF EXISTS newsletter_nexabis_pkey;
ALTER TABLE IF EXISTS ONLY public.modulos_estimacion DROP CONSTRAINT IF EXISTS modulos_estimacion_pkey;
ALTER TABLE IF EXISTS ONLY public.items_presupuesto DROP CONSTRAINT IF EXISTS items_presupuesto_pkey;
ALTER TABLE IF EXISTS ONLY public.items_factura DROP CONSTRAINT IF EXISTS items_factura_pkey;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_pkey;
ALTER TABLE IF EXISTS ONLY public.etiquetas DROP CONSTRAINT IF EXISTS etiquetas_usuario_id_nombre_key;
ALTER TABLE IF EXISTS ONLY public.etiquetas DROP CONSTRAINT IF EXISTS etiquetas_pkey;
ALTER TABLE IF EXISTS ONLY public.estimaciones DROP CONSTRAINT IF EXISTS estimaciones_pkey;
ALTER TABLE IF EXISTS ONLY public.equipos DROP CONSTRAINT IF EXISTS equipos_pkey;
ALTER TABLE IF EXISTS ONLY public.equipo_miembros DROP CONSTRAINT IF EXISTS equipo_miembros_pkey;
ALTER TABLE IF EXISTS ONLY public.equipo_miembros DROP CONSTRAINT IF EXISTS equipo_miembros_equipo_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.documentos DROP CONSTRAINT IF EXISTS documentos_pkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_pkey;
ALTER TABLE IF EXISTS ONLY public.clientes DROP CONSTRAINT IF EXISTS clientes_pkey;
ALTER TABLE IF EXISTS ONLY public.cliente_etiquetas DROP CONSTRAINT IF EXISTS cliente_etiquetas_pkey;
ALTER TABLE IF EXISTS ONLY public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_logs_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY auth.users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE IF EXISTS ONLY auth.sso_providers DROP CONSTRAINT IF EXISTS sso_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.sso_domains DROP CONSTRAINT IF EXISTS sso_domains_pkey;
ALTER TABLE IF EXISTS ONLY auth.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY auth.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_relay_states DROP CONSTRAINT IF EXISTS saml_relay_states_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_pkey;
ALTER TABLE IF EXISTS ONLY auth.saml_providers DROP CONSTRAINT IF EXISTS saml_providers_entity_id_key;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_token_unique;
ALTER TABLE IF EXISTS ONLY auth.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.one_time_tokens DROP CONSTRAINT IF EXISTS one_time_tokens_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_factors DROP CONSTRAINT IF EXISTS mfa_factors_last_challenged_at_key;
ALTER TABLE IF EXISTS ONLY auth.mfa_challenges DROP CONSTRAINT IF EXISTS mfa_challenges_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS mfa_amr_claims_session_id_authentication_method_pkey;
ALTER TABLE IF EXISTS ONLY auth.instances DROP CONSTRAINT IF EXISTS instances_pkey;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_provider_id_provider_unique;
ALTER TABLE IF EXISTS ONLY auth.identities DROP CONSTRAINT IF EXISTS identities_pkey;
ALTER TABLE IF EXISTS ONLY auth.flow_state DROP CONSTRAINT IF EXISTS flow_state_pkey;
ALTER TABLE IF EXISTS ONLY auth.audit_log_entries DROP CONSTRAINT IF EXISTS audit_log_entries_pkey;
ALTER TABLE IF EXISTS ONLY auth.mfa_amr_claims DROP CONSTRAINT IF EXISTS amr_id_pk;
ALTER TABLE IF EXISTS ONLY _realtime.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY _realtime.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY _realtime.extensions DROP CONSTRAINT IF EXISTS extensions_pkey;
ALTER TABLE IF EXISTS supabase_functions.hooks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS auth.refresh_tokens ALTER COLUMN id DROP DEFAULT;
DROP VIEW IF EXISTS vault.decrypted_secrets;
DROP TABLE IF EXISTS supabase_functions.migrations;
DROP SEQUENCE IF EXISTS supabase_functions.hooks_id_seq;
DROP TABLE IF EXISTS supabase_functions.hooks;
DROP TABLE IF EXISTS storage.s3_multipart_uploads_parts;
DROP TABLE IF EXISTS storage.s3_multipart_uploads;
DROP TABLE IF EXISTS storage.objects;
DROP TABLE IF EXISTS storage.migrations;
DROP TABLE IF EXISTS storage.buckets;
DROP TABLE IF EXISTS realtime.subscription;
DROP TABLE IF EXISTS realtime.schema_migrations;
DROP TABLE IF EXISTS realtime.messages;
DROP TABLE IF EXISTS public.usuarios_permitidos;
DROP TABLE IF EXISTS public.user_roles;
DROP TABLE IF EXISTS public.tareas;
DROP TABLE IF EXISTS public.proyectos;
DROP TABLE IF EXISTS public.promociones;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.presupuestos;
DROP TABLE IF EXISTS public.posibles_clientes;
DROP TABLE IF EXISTS public.pipeline_etapas;
DROP TABLE IF EXISTS public.pagos;
DROP TABLE IF EXISTS public.oportunidades;
DROP TABLE IF EXISTS public.notificaciones;
DROP TABLE IF EXISTS public.notas_cliente;
DROP TABLE IF EXISTS public.newsletter_nexabis;
DROP TABLE IF EXISTS public.modulos_estimacion;
DROP TABLE IF EXISTS public.items_presupuesto;
DROP TABLE IF EXISTS public.items_factura;
DROP TABLE IF EXISTS public.facturas;
DROP TABLE IF EXISTS public.etiquetas;
DROP TABLE IF EXISTS public.estimaciones;
DROP TABLE IF EXISTS public.equipos;
DROP TABLE IF EXISTS public.equipo_miembros;
DROP TABLE IF EXISTS public.documentos;
DROP TABLE IF EXISTS public.contratos;
DROP TABLE IF EXISTS public.clientes;
DROP TABLE IF EXISTS public.cliente_etiquetas;
DROP TABLE IF EXISTS public.ai_usage_logs;
DROP TABLE IF EXISTS auth.users;
DROP TABLE IF EXISTS auth.sso_providers;
DROP TABLE IF EXISTS auth.sso_domains;
DROP TABLE IF EXISTS auth.sessions;
DROP TABLE IF EXISTS auth.schema_migrations;
DROP TABLE IF EXISTS auth.saml_relay_states;
DROP TABLE IF EXISTS auth.saml_providers;
DROP SEQUENCE IF EXISTS auth.refresh_tokens_id_seq;
DROP TABLE IF EXISTS auth.refresh_tokens;
DROP TABLE IF EXISTS auth.one_time_tokens;
DROP TABLE IF EXISTS auth.mfa_factors;
DROP TABLE IF EXISTS auth.mfa_challenges;
DROP TABLE IF EXISTS auth.mfa_amr_claims;
DROP TABLE IF EXISTS auth.instances;
DROP TABLE IF EXISTS auth.identities;
DROP TABLE IF EXISTS auth.flow_state;
DROP TABLE IF EXISTS auth.audit_log_entries;
DROP TABLE IF EXISTS _realtime.tenants;
DROP TABLE IF EXISTS _realtime.schema_migrations;
DROP TABLE IF EXISTS _realtime.extensions;
DROP FUNCTION IF EXISTS vault.secrets_encrypt_secret_secret();
DROP FUNCTION IF EXISTS supabase_functions.http_request();
DROP FUNCTION IF EXISTS storage.update_updated_at_column();
DROP FUNCTION IF EXISTS storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);
DROP FUNCTION IF EXISTS storage.operation();
DROP FUNCTION IF EXISTS storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text);
DROP FUNCTION IF EXISTS storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text);
DROP FUNCTION IF EXISTS storage.get_size_by_bucket();
DROP FUNCTION IF EXISTS storage.foldername(name text);
DROP FUNCTION IF EXISTS storage.filename(name text);
DROP FUNCTION IF EXISTS storage.extension(name text);
DROP FUNCTION IF EXISTS storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb);
DROP FUNCTION IF EXISTS realtime.topic();
DROP FUNCTION IF EXISTS realtime.to_regrole(role_name text);
DROP FUNCTION IF EXISTS realtime.subscription_check_filters();
DROP FUNCTION IF EXISTS realtime.send(payload jsonb, event text, topic text, private boolean);
DROP FUNCTION IF EXISTS realtime.quote_wal2json(entity regclass);
DROP FUNCTION IF EXISTS realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer);
DROP FUNCTION IF EXISTS realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]);
DROP FUNCTION IF EXISTS realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text);
DROP FUNCTION IF EXISTS realtime."cast"(val text, type_ regtype);
DROP FUNCTION IF EXISTS realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]);
DROP FUNCTION IF EXISTS realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text);
DROP FUNCTION IF EXISTS realtime.apply_rls(wal jsonb, max_record_bytes integer);
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.sync_task_to_modulo();
DROP FUNCTION IF EXISTS public.sync_modulo_to_task();
DROP FUNCTION IF EXISTS public.has_role(_user_id uuid, _role public.app_role);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_budget_status_change();
DROP FUNCTION IF EXISTS public.get_crm_alerts();
DROP FUNCTION IF EXISTS public.generate_quote_number();
DROP FUNCTION IF EXISTS public.generate_invoice_number();
DROP FUNCTION IF EXISTS public.email_permitido(email_check text);
DROP FUNCTION IF EXISTS public.can_view_presupuesto_by_token(presupuesto_id uuid, provided_token text);
DROP FUNCTION IF EXISTS public.can_create_presupuesto(user_uuid uuid);
DROP FUNCTION IF EXISTS public.calculate_fecha_vencimiento();
DROP FUNCTION IF EXISTS pgbouncer.get_auth(p_usename text);
DROP FUNCTION IF EXISTS extensions.set_graphql_placeholder();
DROP FUNCTION IF EXISTS extensions.pgrst_drop_watch();
DROP FUNCTION IF EXISTS extensions.pgrst_ddl_watch();
DROP FUNCTION IF EXISTS extensions.grant_pg_net_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_graphql_access();
DROP FUNCTION IF EXISTS extensions.grant_pg_cron_access();
DROP FUNCTION IF EXISTS auth.uid();
DROP FUNCTION IF EXISTS auth.role();
DROP FUNCTION IF EXISTS auth.jwt();
DROP FUNCTION IF EXISTS auth.email();
DROP TYPE IF EXISTS realtime.wal_rls;
DROP TYPE IF EXISTS realtime.wal_column;
DROP TYPE IF EXISTS realtime.user_defined_filter;
DROP TYPE IF EXISTS realtime.equality_op;
DROP TYPE IF EXISTS realtime.action;
DROP TYPE IF EXISTS public.app_role;
DROP TYPE IF EXISTS auth.one_time_token_type;
DROP TYPE IF EXISTS auth.factor_type;
DROP TYPE IF EXISTS auth.factor_status;
DROP TYPE IF EXISTS auth.code_challenge_method;
DROP TYPE IF EXISTS auth.aal_level;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS supabase_vault;
DROP EXTENSION IF EXISTS pgjwt;
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS pg_stat_statements;
DROP EXTENSION IF EXISTS pg_graphql;
DROP SCHEMA IF EXISTS vault;
DROP SCHEMA IF EXISTS supabase_functions;
DROP SCHEMA IF EXISTS storage;
DROP SCHEMA IF EXISTS realtime;
DROP EXTENSION IF EXISTS pgsodium;
DROP SCHEMA IF EXISTS pgsodium;
DROP SCHEMA IF EXISTS pgbouncer;
DROP EXTENSION IF EXISTS pg_net;
DROP SCHEMA IF EXISTS graphql_public;
DROP SCHEMA IF EXISTS graphql;
DROP SCHEMA IF EXISTS extensions;
DROP SCHEMA IF EXISTS auth;
DROP SCHEMA IF EXISTS _realtime;
--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _realtime;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: pgsodium; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgsodium;


--
-- Name: pgsodium; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA pgsodium;


--
-- Name: EXTENSION pgsodium; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgsodium IS 'Pgsodium is a modern cryptography library for Postgres.';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_functions;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: pgjwt; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgjwt WITH SCHEMA extensions;


--
-- Name: EXTENSION pgjwt; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgjwt IS 'JSON Web Token API for Postgresql';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'usuario'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RAISE WARNING 'PgBouncer auth request: %', p_usename;

    RETURN QUERY
    SELECT usename::TEXT, passwd::TEXT FROM pg_catalog.pg_shadow
    WHERE usename = p_usename;
END;
$$;


--
-- Name: calculate_fecha_vencimiento(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_fecha_vencimiento() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.fecha_vencimiento = NEW.fecha + (NEW.validez_dias || ' days')::INTERVAL;
  RETURN NEW;
END;
$$;


--
-- Name: can_create_presupuesto(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_create_presupuesto(user_uuid uuid) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  profile_record RECORD;
  count_this_month int;
BEGIN
  -- Fetch subscription info
  SELECT subscription_tier, subscription_status, trial_ends_at, max_presupuestos_mes
  INTO profile_record
  FROM public.profiles
  WHERE id = user_uuid;

  -- No profile found
  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_profile');
  END IF;

  -- Suspended users cannot create anything
  IF profile_record.subscription_status = 'suspended' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_suspended');
  END IF;

  -- Cancelled users cannot create anything
  IF profile_record.subscription_status = 'cancelled' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_cancelled');
  END IF;

  -- Trial expired check
  IF profile_record.subscription_status = 'trial'
     AND profile_record.trial_ends_at IS NOT NULL
     AND profile_record.trial_ends_at < now() THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'trial_expired');
  END IF;

  -- Premium/Enterprise users: unlimited access
  IF profile_record.subscription_tier IN ('premium', 'enterprise')
     AND profile_record.subscription_status IN ('active', 'trial', 'pending_cancellation') THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'premium');
  END IF;

  -- Free tier: check monthly limit
  SELECT COUNT(*) INTO count_this_month
  FROM public.presupuestos
  WHERE usuario_id = user_uuid
    AND date_trunc('month', created_at) = date_trunc('month', now());

  IF count_this_month >= profile_record.max_presupuestos_mes THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'monthly_limit_reached',
      'current', count_this_month,
      'limit', profile_record.max_presupuestos_mes
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'within_limits',
    'remaining', profile_record.max_presupuestos_mes - count_this_month,
    'current', count_this_month,
    'limit', profile_record.max_presupuestos_mes
  );
END;
$$;


--
-- Name: can_view_presupuesto_by_token(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_presupuesto_by_token(presupuesto_id uuid, provided_token text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.presupuestos
    WHERE id = presupuesto_id
      AND token = provided_token
  )
$$;


--
-- Name: email_permitido(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.email_permitido(email_check text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_permitidos
    WHERE email = email_check
      AND activo = TRUE
  )
$$;


--
-- Name: generate_invoice_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_invoice_number() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  year_part TEXT;
  counter INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.facturas
  WHERE usuario_id = NEW.usuario_id
  AND numero LIKE 'FAC-' || year_part || '-%';
  
  NEW.numero := 'FAC-' || year_part || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN NEW;
END;
$$;


--
-- Name: generate_quote_number(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_quote_number() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  year_part TEXT;
  counter INTEGER;
BEGIN
  year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SPLIT_PART(numero, '-', 3) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.presupuestos
  WHERE usuario_id = NEW.usuario_id
  AND numero LIKE 'NEX-' || year_part || '-%';
  
  NEW.numero := 'NEX-' || year_part || '-' || LPAD(counter::TEXT, 4, '0');
  NEW.codigo_auto := NEW.numero;
  RETURN NEW;
END;
$$;


--
-- Name: get_crm_alerts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_crm_alerts() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  t_count INT;
  c_count INT;
  f_count INT;
  p_count INT;
  pg_count INT;
  pg_sum DECIMAL;
  cl_count INT;
BEGIN
  SELECT count(*) INTO t_count FROM public.tareas WHERE estado IN ('to_do', 'in_progress', 'blocked') AND fecha_vencimiento < now();
  SELECT count(*) INTO c_count FROM public.contratos WHERE estado='activo' AND fecha_fin BETWEEN current_date AND current_date + interval '30 days';
  SELECT count(*) INTO f_count FROM public.facturas WHERE estado IN ('borrador', 'enviada');
  SELECT count(*) INTO p_count FROM public.presupuestos WHERE estado='pendiente' AND fecha_vencimiento BETWEEN current_date AND current_date + interval '3 days';
  SELECT count(*), COALESCE(sum(monto), 0) INTO pg_count, pg_sum FROM public.pagos WHERE estado='completado' AND date(fecha_pago) = current_date;
  SELECT count(*) INTO cl_count FROM public.clientes WHERE date_trunc('month', created_at) = date_trunc('month', current_date);

  RETURN json_build_object(
    'tareas_vencidas', t_count,
    'contratos_proximos', c_count,
    'facturas', f_count,
    'presupuestos_vencer', p_count,
    'pagos_hoy', pg_count,
    'total_hoy', pg_sum,
    'clientes_mes', cl_count
  );
END;
$$;


--
-- Name: handle_budget_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_budget_status_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- Si se rechaza el presupuesto
  IF OLD.estado <> 'rechazado' AND NEW.estado = 'rechazado' THEN
    UPDATE public.proyectos
    SET estado = 'cancelado',
        updated_at = now()
    WHERE id = NEW.proyecto_id;
  END IF;

  -- Si se aprueba el presupuesto
  IF OLD.estado <> 'aprobado' AND NEW.estado = 'aprobado' THEN
    UPDATE public.proyectos
    SET estado = 'activo',
        updated_at = now()
    WHERE id = NEW.proyecto_id
    AND estado = 'borrador';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  is_whitelisted boolean;
BEGIN
  -- Check if the email is in the whitelist
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_permitidos
    WHERE email = NEW.email AND activo = TRUE
  ) INTO is_whitelisted;

  IF is_whitelisted THEN
    -- Whitelisted users get premium active immediately
    INSERT INTO public.profiles (id, nombre, email, subscription_tier, subscription_status, trial_ends_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
      NEW.email,
      'premium',
      'active',
      NULL
    );
  ELSE
    -- Regular users get free trial (14 days)
    INSERT INTO public.profiles (id, nombre, email, subscription_tier, subscription_status, trial_ends_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
      NEW.email,
      'free',
      'trial',
      now() + interval '14 days'
    );
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: sync_modulo_to_task(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_modulo_to_task() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Si el estado del modulo cambió
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        
        IF NEW.estado = 'completado' THEN
            -- Buscamos si existe una tarea ligada y la pasamos a done
            UPDATE public.tareas SET estado = 'done', fecha_completada = NOW() WHERE modulo_id = NEW.id;
        ELSIF NEW.estado = 'pendiente' THEN
            -- Si lo des-marcaron por error, lo pasamos a In Progress o To_do
            UPDATE public.tareas SET estado = 'in_progress', fecha_completada = NULL WHERE modulo_id = NEW.id AND estado = 'done';
        END IF;

    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: sync_task_to_modulo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_task_to_modulo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Si la tarea esta vinculada a un modulo y el estado cambió
    IF NEW.modulo_id IS NOT NULL AND NEW.estado IS DISTINCT FROM OLD.estado THEN
        
        -- Si la tarea se mueve a 'done', completamos el modulo
        IF NEW.estado = 'done' THEN
            UPDATE public.modulos_estimacion SET estado = 'completado' WHERE id = NEW.modulo_id;
        -- Si la tarea pasa de 'done' a cualquier otro estado (ej to_do), devolvemos el modulo a pendiente
        ELSIF OLD.estado = 'done' AND NEW.estado != 'done' THEN
            UPDATE public.modulos_estimacion SET estado = 'pendiente' WHERE id = NEW.modulo_id;
        END IF;

    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      PERFORM pg_notify(
          'realtime:system',
          jsonb_build_object(
              'error', SQLERRM,
              'function', 'realtime.send',
              'event', event,
              'topic', topic,
              'private', private
          )::text
      );
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: -
--

CREATE FUNCTION supabase_functions.http_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


--
-- Name: secrets_encrypt_secret_secret(); Type: FUNCTION; Schema: vault; Owner: -
--

CREATE FUNCTION vault.secrets_encrypt_secret_secret() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
		BEGIN
		        new.secret = CASE WHEN new.secret IS NULL THEN NULL ELSE
			CASE WHEN new.key_id IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.secret, 'utf8'),
				pg_catalog.convert_to((new.id::text || new.description::text || new.created_at::text || new.updated_at::text)::text, 'utf8'),
				new.key_id::uuid,
				new.nonce
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL
);


--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: ai_usage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_usage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    tipo_operacion text NOT NULL,
    tokens_entrada integer,
    tokens_salida integer,
    modelo text,
    rubro_contexto text,
    exitoso boolean DEFAULT true,
    error_mensaje text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cliente_etiquetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cliente_etiquetas (
    cliente_id uuid NOT NULL,
    etiqueta_id uuid NOT NULL
);


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    telefono text,
    empresa text,
    direccion text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    rut text,
    industria text,
    fuente text DEFAULT 'directo'::text,
    etapa_ciclo text DEFAULT 'lead'::text,
    avatar_url text,
    notas text,
    sitio_web text,
    valor_total numeric(12,2) DEFAULT 0
);


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    titulo text NOT NULL,
    descripcion text,
    valor numeric(12,2),
    moneda text DEFAULT 'CLP'::text,
    estado text DEFAULT 'borrador'::text,
    fecha_inicio date,
    fecha_fin date,
    renovacion_auto boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    nombre text NOT NULL,
    url text NOT NULL,
    tipo_mime text,
    tamano_bytes bigint,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: equipo_miembros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipo_miembros (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    equipo_id uuid,
    user_id uuid,
    rol text DEFAULT 'miembro'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: equipos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: estimaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estimaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proyecto_id uuid NOT NULL,
    titulo text NOT NULL,
    total_horas integer NOT NULL,
    costo_total numeric NOT NULL,
    complejidad text,
    nivel_confianza text,
    riesgos jsonb,
    suposiciones jsonb,
    es_elegida boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    costo_hora numeric
);


--
-- Name: COLUMN estimaciones.costo_hora; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.estimaciones.costo_hora IS 'Hourly rate used for this estimation version';


--
-- Name: etiquetas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.etiquetas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    nombre text NOT NULL,
    color text DEFAULT '#8b5cf6'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facturas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    presupuesto_id uuid,
    numero text NOT NULL,
    titulo text NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    iva_porcentaje numeric(5,2) DEFAULT 19,
    iva_monto numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    moneda text DEFAULT 'CLP'::text,
    estado text DEFAULT 'borrador'::text,
    fecha_emision date DEFAULT CURRENT_DATE,
    fecha_vencimiento date,
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: items_factura; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items_factura (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    factura_id uuid NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric(10,2) DEFAULT 1,
    precio_unitario numeric(12,2) NOT NULL,
    total numeric(12,2) NOT NULL,
    orden integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: items_presupuesto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items_presupuesto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    presupuesto_id uuid NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric DEFAULT 1 NOT NULL,
    precio_unitario numeric NOT NULL,
    total numeric NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: modulos_estimacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modulos_estimacion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    estimacion_id uuid NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    horas_estimadas integer NOT NULL,
    prioridad integer DEFAULT 4,
    nivel_riesgo text,
    justificacion text,
    estado text DEFAULT 'pendiente'::text,
    es_excluido boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    costo_fijo numeric DEFAULT 0,
    cantidad numeric DEFAULT 1
);


--
-- Name: newsletter_nexabis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_nexabis (
    id bigint NOT NULL,
    email character varying NOT NULL,
    fecha_registro timestamp without time zone
);


--
-- Name: newsletter_nexabis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_nexabis ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.newsletter_nexabis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notas_cliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notas_cliente (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    contenido text NOT NULL,
    tipo text DEFAULT 'nota'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    presupuesto_id uuid,
    tipo text NOT NULL,
    mensaje text NOT NULL,
    visto boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: oportunidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oportunidades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    etapa_id uuid NOT NULL,
    titulo text NOT NULL,
    valor numeric(12,2) DEFAULT 0,
    moneda text DEFAULT 'CLP'::text,
    probabilidad integer DEFAULT 50,
    fecha_cierre_esperada date,
    notas text,
    estado text DEFAULT 'abierta'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    presupuesto_id uuid,
    factura_id uuid,
    monto numeric(12,2) NOT NULL,
    moneda text DEFAULT 'CLP'::text,
    metodo_pago text DEFAULT 'transferencia'::text NOT NULL,
    referencia text,
    mp_payment_id text,
    estado text DEFAULT 'completado'::text,
    fecha_pago timestamp with time zone DEFAULT now(),
    notas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pipeline_etapas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipeline_etapas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    nombre text NOT NULL,
    color text DEFAULT '#8b5cf6'::text,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: posibles_clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posibles_clientes (
    email character varying NOT NULL,
    empresa character varying NOT NULL,
    nombre character varying,
    mensaje text,
    hora_registro timestamp without time zone DEFAULT now(),
    telefono character varying NOT NULL
);


--
-- Name: TABLE posibles_clientes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.posibles_clientes IS 'Tabla para inyectar personas/empresas que necesitan contacto en web Nexabis';


--
-- Name: presupuestos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presupuestos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid NOT NULL,
    numero text NOT NULL,
    codigo_auto text,
    titulo text NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    validez_dias integer DEFAULT 15 NOT NULL,
    fecha_vencimiento date,
    subtotal numeric DEFAULT 0 NOT NULL,
    descuento_tipo text,
    descuento_valor numeric DEFAULT 0,
    descuento_total numeric DEFAULT 0,
    iva_porcentaje numeric DEFAULT 19,
    iva_monto numeric DEFAULT 0,
    total numeric DEFAULT 0 NOT NULL,
    moneda text DEFAULT 'CLP'::text NOT NULL,
    estado text DEFAULT 'pendiente'::text NOT NULL,
    forma_pago text,
    terminos text,
    notas_trabajo text,
    promocion_aplicada text,
    comentarios_cliente text,
    token text DEFAULT (gen_random_uuid())::text NOT NULL,
    modo_impresion text DEFAULT 'dark'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    proyecto_id uuid,
    mp_pago_1_monto numeric(12,2),
    mp_pago_1_id text,
    mp_pago_1_status text,
    mp_pago_1_fecha timestamp with time zone,
    mp_pago_2_monto numeric(12,2),
    mp_pago_2_id text,
    mp_pago_2_status text,
    mp_pago_2_fecha timestamp with time zone,
    CONSTRAINT presupuestos_mp_pago_1_status_check CHECK ((mp_pago_1_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'in_process'::text, 'cancelled'::text, 'refunded'::text, 'charged_back'::text]))),
    CONSTRAINT presupuestos_mp_pago_2_status_check CHECK ((mp_pago_2_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'in_process'::text, 'cancelled'::text, 'refunded'::text, 'charged_back'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    rut text,
    nombre_empresa text,
    logo_url text,
    direccion text,
    telefono text,
    plantilla_tyc text DEFAULT 'Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.'::text,
    moneda_predeterminada text DEFAULT 'CLP'::text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    equipo_id uuid,
    subscription_tier text DEFAULT 'free'::text,
    subscription_status text DEFAULT 'trial'::text,
    trial_ends_at timestamp with time zone DEFAULT (now() + '14 days'::interval),
    subscription_current_period_end timestamp with time zone,
    subscription_cancel_at_period_end boolean DEFAULT false,
    subscription_external_id text,
    subscription_provider text,
    rubro text DEFAULT 'tecnologia'::text,
    max_presupuestos_mes integer DEFAULT 5,
    email_empresa text,
    CONSTRAINT chk_subscription_status CHECK ((subscription_status = ANY (ARRAY['trial'::text, 'active'::text, 'suspended'::text, 'cancelled'::text, 'pending_cancellation'::text]))),
    CONSTRAINT chk_subscription_tier CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'premium'::text, 'enterprise'::text])))
);


--
-- Name: promociones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promociones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    descuento_porcentaje numeric NOT NULL,
    monto_minimo numeric NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    activa boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: proyectos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proyectos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid,
    nombre text NOT NULL,
    descripcion text,
    tipo text NOT NULL,
    urgencia text,
    presupuesto_cliente numeric,
    estado text DEFAULT 'borrador'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tareas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tareas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    usuario_id uuid NOT NULL,
    cliente_id uuid,
    oportunidad_id uuid,
    proyecto_id uuid,
    titulo text NOT NULL,
    descripcion text,
    tipo text DEFAULT 'tarea'::text,
    prioridad text DEFAULT 'media'::text,
    estado text DEFAULT 'pendiente'::text,
    fecha_vencimiento timestamp with time zone,
    fecha_completada timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    modulo_id uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: usuarios_permitidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios_permitidos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    activo boolean DEFAULT true,
    invitado_por uuid,
    fecha_invitacion timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.hooks (
    id bigint NOT NULL,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);


--
-- Name: TABLE hooks; Type: COMMENT; Schema: supabase_functions; Owner: -
--

COMMENT ON TABLE supabase_functions.hooks IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: -
--

CREATE SEQUENCE supabase_functions.hooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: -
--

ALTER SEQUENCE supabase_functions.hooks_id_seq OWNED BY supabase_functions.hooks.id;


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.migrations (
    version text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: decrypted_secrets; Type: VIEW; Schema: vault; Owner: -
--

CREATE VIEW vault.decrypted_secrets AS
 SELECT secrets.id,
    secrets.name,
    secrets.description,
    secrets.secret,
        CASE
            WHEN (secrets.secret IS NULL) THEN NULL::text
            ELSE
            CASE
                WHEN (secrets.key_id IS NULL) THEN NULL::text
                ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(secrets.secret, 'base64'::text), convert_to(((((secrets.id)::text || secrets.description) || (secrets.created_at)::text) || (secrets.updated_at)::text), 'utf8'::name), secrets.key_id, secrets.nonce), 'utf8'::name)
            END
        END AS decrypted_secret,
    secrets.key_id,
    secrets.nonce,
    secrets.created_at,
    secrets.updated_at
   FROM vault.secrets;


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks ALTER COLUMN id SET DEFAULT nextval('supabase_functions.hooks_id_seq'::regclass);


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.extensions (id, type, settings, tenant_external_id, inserted_at, updated_at) FROM stdin;
9f72b0f4-6f39-4dac-8c19-a5bb3b3c9bc0	postgres_cdc_rls	{"region": "us-east-1", "db_host": "UQODY0+dwiSQvuHHKwAFHg==", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "PMoV31DTNiR/SFqeq/uNBQ==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2026-03-05 00:19:18	2026-03-05 00:19:18
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.schema_migrations (version, inserted_at) FROM stdin;
20210706140551	2025-11-14 14:54:36
20220329161857	2025-11-14 14:54:36
20220410212326	2025-11-14 14:54:36
20220506102948	2025-11-14 14:54:37
20220527210857	2025-11-14 14:54:37
20220815211129	2025-11-14 14:54:37
20220815215024	2025-11-14 14:54:37
20220818141501	2025-11-14 14:54:37
20221018173709	2025-11-14 14:54:37
20221102172703	2025-11-14 14:54:37
20221223010058	2025-11-14 14:54:37
20230110180046	2025-11-14 14:54:37
20230810220907	2025-11-14 14:54:37
20230810220924	2025-11-14 14:54:37
20231024094642	2025-11-14 14:54:37
20240306114423	2025-11-14 14:54:37
20240418082835	2025-11-14 14:54:37
20240625211759	2025-11-14 14:54:37
20240704172020	2025-11-14 14:54:37
20240902173232	2025-11-14 14:54:37
20241106103258	2025-11-14 14:54:37
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.tenants (id, name, external_id, jwt_secret, max_concurrent_users, inserted_at, updated_at, max_events_per_second, postgres_cdc_default, max_bytes_per_second, max_channels_per_client, max_joins_per_second, suspend, jwt_jwks, notify_private_alpha, private_only) FROM stdin;
b6628cab-7932-40c2-92db-d5a6a982a890	realtime-dev	realtime-dev	eRdhOnmOiBvZCznf7RtR1+x9iyuQqRnzzBAXThPE/29PNrrhma6I8nd28t/mto4/	200	2026-03-05 00:19:18	2026-03-05 00:19:18	100	postgres_cdc_rls	100000	100	100	f	\N	f	f
\.


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	71ed7f9b-7c97-48b9-8487-5d2a5661b594	{"action":"user_signedup","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-11-14 15:01:56.476198+00	
00000000-0000-0000-0000-000000000000	09977d8a-1a40-47c0-837b-e89f5ca5a3d1	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-14 15:01:56.480655+00	
00000000-0000-0000-0000-000000000000	d277e71c-feeb-4a2e-a5ad-5dbf614d3a43	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-11-14 15:03:07.260448+00	
00000000-0000-0000-0000-000000000000	cadb681e-23e1-4307-8ce8-c542ba29a4f8	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-14 21:30:40.356797+00	
00000000-0000-0000-0000-000000000000	e4c46fda-3ea3-4bc5-b622-39192c87d9d0	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-14 23:01:32.884105+00	
00000000-0000-0000-0000-000000000000	211c7e68-626a-4d2a-b083-a9ae4c3a986a	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-11-14 23:03:48.805051+00	
00000000-0000-0000-0000-000000000000	4381997f-6c96-4b51-b78c-51bed8bff838	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-14 23:24:21.954299+00	
00000000-0000-0000-0000-000000000000	67c49309-db1f-4c40-90b3-1a156ad75760	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-15 00:42:03.836327+00	
00000000-0000-0000-0000-000000000000	82489f6a-79a5-46eb-ba1c-25e0ba69d3f1	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-15 00:42:03.843174+00	
00000000-0000-0000-0000-000000000000	22b4323e-0310-4ad3-b7b2-63f66d4df9cf	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-15 00:42:19.066098+00	
00000000-0000-0000-0000-000000000000	e15fdd47-feb0-4bb1-b507-25a4e32b525d	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-15 00:47:53.19211+00	
00000000-0000-0000-0000-000000000000	2da820aa-f4d2-45c8-896b-c5904e99a8d5	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-16 02:51:18.500406+00	
00000000-0000-0000-0000-000000000000	fb1f95a2-3aa5-4a33-a8e7-ee9a56e3466e	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-11-16 02:56:01.463411+00	
00000000-0000-0000-0000-000000000000	6c1b5cd1-efaa-46e6-9100-00b78a67cea8	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-16 02:56:47.123684+00	
00000000-0000-0000-0000-000000000000	e1c30066-695a-482f-92d4-4ff50629f542	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-16 03:19:47.052512+00	
00000000-0000-0000-0000-000000000000	44ba3917-f5b1-4aa0-a74c-c8d72dbae152	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-16 03:32:16.016339+00	
00000000-0000-0000-0000-000000000000	8db6a55f-cbad-44c2-9a3c-395139152fe9	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-11-16 03:34:07.485477+00	
00000000-0000-0000-0000-000000000000	7fdb9751-5ab3-4df7-b8f0-f7c2d8a7b186	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-16 23:45:45.80735+00	
00000000-0000-0000-0000-000000000000	8043cdd6-e9ed-401b-8b7f-a05679e6b4ff	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-11-16 23:47:11.633552+00	
00000000-0000-0000-0000-000000000000	8aeb6131-bc19-4f12-ab91-708b14e3fca0	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-16 23:47:52.834888+00	
00000000-0000-0000-0000-000000000000	07e87e63-32fa-49d7-9051-45d9d3a6e60f	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-17 01:57:36.061243+00	
00000000-0000-0000-0000-000000000000	dae690ab-8e25-450f-a8b8-e5eb017dc836	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-17 12:42:35.916324+00	
00000000-0000-0000-0000-000000000000	a69d0640-a7a6-4dad-9afd-c0536d848b36	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-17 12:42:35.930104+00	
00000000-0000-0000-0000-000000000000	96524236-ff16-4eba-acc4-eb488075b969	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-17 12:42:36.053574+00	
00000000-0000-0000-0000-000000000000	6ecb0435-eec0-478c-96ab-da56667fe3e7	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-17 14:27:23.746523+00	
00000000-0000-0000-0000-000000000000	246f8d90-1ea5-4551-870f-ccca52ab99e8	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-11-17 14:27:55.398544+00	
00000000-0000-0000-0000-000000000000	a99ad88d-e447-48ec-ae24-6c3ec19948be	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-11-22 01:11:11.089379+00	
00000000-0000-0000-0000-000000000000	ca7a1361-ee25-4a24-a319-88c327db806b	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-22 22:24:36.501196+00	
00000000-0000-0000-0000-000000000000	ce6d2ef5-35bb-4aaf-ba07-74e75df4bce0	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-22 22:24:36.513252+00	
00000000-0000-0000-0000-000000000000	03ebfb8e-ccfa-4279-bfc9-9e53b0467162	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-23 18:16:21.827059+00	
00000000-0000-0000-0000-000000000000	260f33b2-27f6-45ec-b29a-65236d1081fd	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-11-23 18:16:21.839054+00	
00000000-0000-0000-0000-000000000000	e55a6323-71a6-467b-9fc8-9250981806a2	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-09 14:16:16.591968+00	
00000000-0000-0000-0000-000000000000	69af8712-9697-4d29-834d-4befd5bd35ca	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-12-09 14:17:43.901606+00	
00000000-0000-0000-0000-000000000000	0b1a5848-7a2b-4884-9f30-b1779209e5d9	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-13 00:04:46.173131+00	
00000000-0000-0000-0000-000000000000	dbedebf5-ed69-4097-ac63-f8d8beda4646	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-16 01:11:02.764215+00	
00000000-0000-0000-0000-000000000000	661fd5cc-9433-468b-8da4-4f808fae5599	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-16 01:11:02.773186+00	
00000000-0000-0000-0000-000000000000	e5d02e61-41a9-4899-9efd-beb5e9ac34f2	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-16 01:11:24.456814+00	
00000000-0000-0000-0000-000000000000	8505fa5d-048f-4911-bb87-423f9b0ec3c1	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2025-12-16 01:15:11.342894+00	
00000000-0000-0000-0000-000000000000	f97e2024-9d2a-43df-a63f-0c52cc88230c	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 00:18:09.140864+00	
00000000-0000-0000-0000-000000000000	4dcbaf39-a65f-4f5f-8395-f1133f8f273c	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 15:25:20.663371+00	
00000000-0000-0000-0000-000000000000	6807f425-d133-4fb5-a4a8-e6a0d34f6d62	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 15:30:13.435778+00	
00000000-0000-0000-0000-000000000000	cfa7a979-21c3-470e-b5f7-e7d3bf044047	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 15:34:57.551009+00	
00000000-0000-0000-0000-000000000000	4d9635d7-1775-42e7-af85-95c35e91e739	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 15:46:10.880099+00	
00000000-0000-0000-0000-000000000000	78be6f98-cf48-46c9-88b4-abee76d79877	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 15:55:22.230117+00	
00000000-0000-0000-0000-000000000000	45eee87c-7694-4655-8118-e274c21c417d	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 17:08:31.962085+00	
00000000-0000-0000-0000-000000000000	185e19d5-2ea2-4810-a739-2607262381ef	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 17:08:31.966082+00	
00000000-0000-0000-0000-000000000000	798eecd2-abc9-4fea-b63a-079bea44805f	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 18:56:36.861027+00	
00000000-0000-0000-0000-000000000000	67f9a083-fa01-463d-bc8f-8062591aedc8	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 18:56:36.869925+00	
00000000-0000-0000-0000-000000000000	816e6471-bc57-4410-9313-01fb0af4aa7b	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 19:47:20.32135+00	
00000000-0000-0000-0000-000000000000	123a6756-3ea7-4038-afbb-ddf7800f117d	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 19:48:43.985138+00	
00000000-0000-0000-0000-000000000000	f7d4a78d-741b-4092-8bf9-03721850455f	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 20:59:19.832+00	
00000000-0000-0000-0000-000000000000	eabb81ae-4839-4a63-b86a-6227853ce800	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 20:59:19.839151+00	
00000000-0000-0000-0000-000000000000	9b9188fc-a8a5-4897-93f4-a3881b45363a	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 21:40:02.405581+00	
00000000-0000-0000-0000-000000000000	8d084653-bad6-4672-bbab-cad803987ea1	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 21:40:02.410055+00	
00000000-0000-0000-0000-000000000000	b301d008-42b1-436a-a8bf-6e8ae3ae88d1	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 21:40:16.976559+00	
00000000-0000-0000-0000-000000000000	c15376c5-bc5c-4ce6-b9ca-4983c2a4a9e1	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 22:09:22.544679+00	
00000000-0000-0000-0000-000000000000	972dee6d-f9e4-4511-8569-496b8bb0081d	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-18 22:43:20.031959+00	
00000000-0000-0000-0000-000000000000	d01768ad-460b-418b-90df-23ae8419547f	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 23:26:56.629581+00	
00000000-0000-0000-0000-000000000000	7a5002e9-eed5-4413-aa58-d368a46b0a6b	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-18 23:26:56.631978+00	
00000000-0000-0000-0000-000000000000	e2875da1-7a80-4e70-b8fa-febfe4c1de78	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 01:33:20.836007+00	
00000000-0000-0000-0000-000000000000	e4329a5f-0a6d-4e91-a1d2-67290452f6d3	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 01:33:20.842806+00	
00000000-0000-0000-0000-000000000000	96e8be13-8ca3-4db6-bbec-4ef75b229141	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 02:59:32.430186+00	
00000000-0000-0000-0000-000000000000	57330e3b-3c06-4f43-869f-b55154d02428	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 02:59:32.437487+00	
00000000-0000-0000-0000-000000000000	e360baf9-ba5c-4527-b3a5-b51760dfb372	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 14:20:29.053389+00	
00000000-0000-0000-0000-000000000000	1296e2dc-5368-4e21-8d38-4302bf59657e	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 14:20:29.062166+00	
00000000-0000-0000-0000-000000000000	a73fd33e-dfd7-415c-b5b3-ddc60308acf7	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 14:45:02.624841+00	
00000000-0000-0000-0000-000000000000	98ebcb0b-fcea-4466-9e93-a150eabb7dce	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 14:52:32.141989+00	
00000000-0000-0000-0000-000000000000	fe01d325-9ef2-47e2-9897-412a827eadac	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 14:52:32.145264+00	
00000000-0000-0000-0000-000000000000	13d3329d-20c0-4e0e-b151-040d3319fcb5	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 14:52:49.283244+00	
00000000-0000-0000-0000-000000000000	39dc7ad0-a1be-4aaf-b0c4-a0ae789f0744	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 14:56:04.783726+00	
00000000-0000-0000-0000-000000000000	8e37f2da-c551-4233-a761-ea3cdad31a20	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 14:56:04.78965+00	
00000000-0000-0000-0000-000000000000	babc6bc8-a73b-46e5-ac88-a8d2b4053a9f	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 15:13:38.104769+00	
00000000-0000-0000-0000-000000000000	7e5ce9e3-fb84-4d62-b69b-96b79654b4ed	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 15:23:59.944559+00	
00000000-0000-0000-0000-000000000000	1be5d921-77c6-48f0-8b00-4b76eaae3781	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 15:23:59.947178+00	
00000000-0000-0000-0000-000000000000	cc681d8a-2cf6-48e1-abce-01b02df121df	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 15:24:12.086957+00	
00000000-0000-0000-0000-000000000000	d527aa2d-6d06-4386-917a-fe3768be3e91	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 16:22:49.310432+00	
00000000-0000-0000-0000-000000000000	501cebdb-709c-48e6-8ab6-4df24b2edbe0	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 16:22:49.320372+00	
00000000-0000-0000-0000-000000000000	42b095b6-35f2-48ac-9ec3-ca343d02958e	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 16:36:16.102834+00	
00000000-0000-0000-0000-000000000000	7d103b51-79f3-443d-9f2c-692f51888490	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 16:37:40.77688+00	
00000000-0000-0000-0000-000000000000	70099f4c-ea3a-43df-8b5e-9211d841e637	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 16:37:40.778272+00	
00000000-0000-0000-0000-000000000000	0742f3e1-5ee7-420f-b611-93f8c3002604	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 17:06:53.860038+00	
00000000-0000-0000-0000-000000000000	66ed6cb3-d16a-4211-a84a-293dae9a96e4	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 23:21:16.27884+00	
00000000-0000-0000-0000-000000000000	b559d424-dd41-4867-91ba-7f25d9f8e375	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 23:21:16.284281+00	
00000000-0000-0000-0000-000000000000	6a94c755-9b0b-42e7-b717-39670c7cc738	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 23:21:29.507233+00	
00000000-0000-0000-0000-000000000000	e64cc59d-865e-46b8-9e7b-7b63d3ffc29d	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 23:56:47.200882+00	
00000000-0000-0000-0000-000000000000	c49aecb3-411a-430a-a3d9-f340e979f983	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-19 23:56:47.203566+00	
00000000-0000-0000-0000-000000000000	77225a8e-524b-4cb8-99fa-7c5597718759	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-19 23:56:54.754568+00	
00000000-0000-0000-0000-000000000000	17b0d733-e15e-4641-a55c-34c01b4aab2f	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-20 03:08:18.184025+00	
00000000-0000-0000-0000-000000000000	8b6abebe-b711-49df-8799-c682eca03e5a	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-20 03:08:18.19954+00	
00000000-0000-0000-0000-000000000000	695dc112-b126-4898-91e6-567310e72100	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-21 21:56:42.968572+00	
00000000-0000-0000-0000-000000000000	9cfd1347-7fa3-4b90-b382-a6c036df70d6	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-21 21:58:08.062887+00	
00000000-0000-0000-0000-000000000000	957bedcf-d35a-4399-a721-a88be9178f98	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-21 22:56:10.125626+00	
00000000-0000-0000-0000-000000000000	90c2153c-214a-4aaa-918c-804279dce5b2	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-21 22:56:10.130186+00	
00000000-0000-0000-0000-000000000000	2f011d64-59a3-4ba9-bf09-6d7438e56f21	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-23 17:31:30.310339+00	
00000000-0000-0000-0000-000000000000	483d3a94-6706-4069-a8d4-2335d3818118	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-23 17:31:30.321631+00	
00000000-0000-0000-0000-000000000000	0eeef88b-4ba0-489c-bbcb-d768e2f66064	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-23 17:31:39.184518+00	
00000000-0000-0000-0000-000000000000	31f23a5d-c371-47d9-a981-6d361e0b5341	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-23 18:30:00.929206+00	
00000000-0000-0000-0000-000000000000	12d6bd75-cc5e-45d7-9646-379d5fe074b7	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-23 18:30:00.943521+00	
00000000-0000-0000-0000-000000000000	bf0baa78-e071-4825-b29e-8755b9d7b437	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-23 19:28:01.617978+00	
00000000-0000-0000-0000-000000000000	03670e02-31da-4e39-96e0-329d5c758621	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-23 19:28:01.626856+00	
00000000-0000-0000-0000-000000000000	d48d9d8d-d83b-4082-998a-826e9bea6dd8	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 12:08:56.592801+00	
00000000-0000-0000-0000-000000000000	8582b3f5-a8b2-4074-b31f-232426d33ba2	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 12:08:56.603965+00	
00000000-0000-0000-0000-000000000000	8fc03b83-2b4d-44d1-97b4-c612d37f4172	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 13:19:58.056344+00	
00000000-0000-0000-0000-000000000000	1ff25041-21d5-46de-975d-5bf123a3b8e4	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 13:19:58.060504+00	
00000000-0000-0000-0000-000000000000	2e5fbd7c-dcf0-42bb-91ff-2c8367952f84	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 16:07:01.614827+00	
00000000-0000-0000-0000-000000000000	bd92e194-b2e0-43c6-b69b-f5f7cb25bfe3	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 16:07:01.630833+00	
00000000-0000-0000-0000-000000000000	0e9f1e82-eebd-4379-b909-f90574038051	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-24 16:07:10.010316+00	
00000000-0000-0000-0000-000000000000	1d300dae-a9e2-4f77-8be7-5238e11952a3	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 16:12:35.635317+00	
00000000-0000-0000-0000-000000000000	066179fd-55ba-4c0c-8992-e11914d7e24f	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 16:12:35.638375+00	
00000000-0000-0000-0000-000000000000	8edc71bc-730d-4893-b57b-11b2363205e2	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-24 16:12:49.46243+00	
00000000-0000-0000-0000-000000000000	7ce3b662-cb4e-4307-929a-397b29e6ee8c	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 17:09:27.32823+00	
00000000-0000-0000-0000-000000000000	b24f2dc6-94c8-41ea-86dc-61e5eebb60f1	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 17:09:27.330727+00	
00000000-0000-0000-0000-000000000000	3be648f3-c484-48cf-9a48-b1da2688b66d	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 17:16:40.213011+00	
00000000-0000-0000-0000-000000000000	f3898a6e-151b-4197-a333-52e28b86ce16	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-24 17:16:40.217655+00	
00000000-0000-0000-0000-000000000000	0408a3e3-49fa-4c3c-bc0a-f6e9c68ee428	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-26 17:02:54.472087+00	
00000000-0000-0000-0000-000000000000	5312f8cc-5504-4e30-a03b-e4505d55d5c8	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-12-26 17:02:54.501244+00	
00000000-0000-0000-0000-000000000000	ad2e4308-6b3d-4d62-a667-09315d080ccf	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-12-26 17:03:11.042229+00	
00000000-0000-0000-0000-000000000000	62b9f5a8-7059-4fe0-bf82-d9d99419bc61	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 02:50:51.230883+00	
00000000-0000-0000-0000-000000000000	59105abf-f6c2-495a-a671-824cc16caac9	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 02:50:51.240078+00	
00000000-0000-0000-0000-000000000000	26b00f65-4999-4a20-9063-8c0d3c311b2f	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-21 02:51:02.508652+00	
00000000-0000-0000-0000-000000000000	e210c47d-c55f-4c16-8423-7a6a1c0cf9a6	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 03:01:15.178065+00	
00000000-0000-0000-0000-000000000000	2330586f-fc55-4c0a-87ab-d15b92f3a018	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 03:01:15.183159+00	
00000000-0000-0000-0000-000000000000	ea64004f-60e2-4416-8ea0-d2a609b52837	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-21 03:01:20.898994+00	
00000000-0000-0000-0000-000000000000	68df5b18-e8f6-4936-bf64-6716c51cd8e2	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 12:06:32.677823+00	
00000000-0000-0000-0000-000000000000	4d738ccd-2069-47c6-90fd-9e5e2056dc29	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 12:06:32.687015+00	
00000000-0000-0000-0000-000000000000	d31a8924-b679-4d60-b1f5-5ee6fbbaefcc	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 13:02:29.965674+00	
00000000-0000-0000-0000-000000000000	76498a2a-6887-4bb7-be7f-78adeae1c42c	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 13:02:29.9888+00	
00000000-0000-0000-0000-000000000000	42ddd49e-cd06-4ec9-b16b-56e34a8c96ae	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 13:19:12.457131+00	
00000000-0000-0000-0000-000000000000	e857c082-d060-4143-b442-a97a7f8426ce	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 13:19:12.46925+00	
00000000-0000-0000-0000-000000000000	09a216bb-a0d7-4d9e-a1dc-a935ffbd193b	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 14:33:12.27742+00	
00000000-0000-0000-0000-000000000000	ab0f5518-ac78-405a-a690-f8c06cb78fe4	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 14:33:12.283091+00	
00000000-0000-0000-0000-000000000000	b65d22ba-5ba6-42b0-a0b5-28f5b32fad9d	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 14:47:03.542061+00	
00000000-0000-0000-0000-000000000000	768a3fad-1279-4cdd-9413-f4c3e495b88c	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-21 14:47:03.543385+00	
00000000-0000-0000-0000-000000000000	1b3f2681-020b-4bb1-9c95-3e69f9caaa01	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-21 23:38:45.659947+00	
00000000-0000-0000-0000-000000000000	1d64f731-c7c7-4e9a-82b3-b1b950805dc1	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-22 01:26:21.54199+00	
00000000-0000-0000-0000-000000000000	9b3f7811-10d6-465b-ad6c-7a32daf089fc	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-22 01:26:21.547109+00	
00000000-0000-0000-0000-000000000000	79a4b305-6dae-4afc-a063-b6dc75e44427	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-22 01:26:36.742941+00	
00000000-0000-0000-0000-000000000000	ae4c5b0f-b77a-4a3e-92c0-d13053e1bc30	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-22 02:02:25.522196+00	
00000000-0000-0000-0000-000000000000	c6db47a5-598e-43eb-8eb8-6bc3746781d2	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-01-22 02:02:25.540173+00	
00000000-0000-0000-0000-000000000000	89b49479-1a69-4ca1-9f9c-263814b6db59	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-01-22 02:12:55.988614+00	
00000000-0000-0000-0000-000000000000	4df745ba-4b2e-40f4-9f35-44d542420851	{"action":"user_signedup","actor_id":"3b3c9690-35fd-4d19-950c-8d56f671d5b0","actor_username":"cristopher910@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2026-01-22 02:19:35.386572+00	
00000000-0000-0000-0000-000000000000	bdcf33d4-a98b-45ef-a31d-58d6f150cb9b	{"action":"login","actor_id":"3b3c9690-35fd-4d19-950c-8d56f671d5b0","actor_username":"cristopher910@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-22 02:19:35.398802+00	
00000000-0000-0000-0000-000000000000	b761c6f1-3a63-485f-b257-e67322ec6ad7	{"action":"login","actor_id":"3b3c9690-35fd-4d19-950c-8d56f671d5b0","actor_username":"cristopher910@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-22 02:22:09.142994+00	
00000000-0000-0000-0000-000000000000	9f418a68-2547-4af7-aefd-40d65e46e552	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-22 02:22:09.522902+00	
00000000-0000-0000-0000-000000000000	e53634e4-4091-46c9-b378-2d814c068cf1	{"action":"login","actor_id":"3b3c9690-35fd-4d19-950c-8d56f671d5b0","actor_username":"cristopher910@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-01-22 02:23:27.517509+00	
00000000-0000-0000-0000-000000000000	5854292a-b271-4538-9483-607de9b67648	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-19 18:43:39.902846+00	
00000000-0000-0000-0000-000000000000	333ab37b-3747-48e6-b83e-cc1452cb2146	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-19 20:12:43.38644+00	
00000000-0000-0000-0000-000000000000	4dbfe0f4-6ce7-445d-926c-a7f6944057e6	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-19 20:12:43.394073+00	
00000000-0000-0000-0000-000000000000	48b1c510-42c8-488c-bd6c-d8a6f2c540f1	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-20 13:57:11.650381+00	
00000000-0000-0000-0000-000000000000	b309748f-ec00-4ced-944a-b5f852ea7963	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-02-20 14:00:48.924223+00	
00000000-0000-0000-0000-000000000000	01fff4c8-b29f-434b-ac92-60ff87c217eb	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-20 14:01:05.392674+00	
00000000-0000-0000-0000-000000000000	b7c5a361-ebe0-4d54-b7ff-ccb4961ec997	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-02-20 14:04:48.622696+00	
00000000-0000-0000-0000-000000000000	696cd34b-8271-43db-acd7-10bfbec8396c	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-20 14:55:41.624027+00	
00000000-0000-0000-0000-000000000000	328ea3eb-226a-4028-822d-a2f91c973b38	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-02-20 14:57:43.553821+00	
00000000-0000-0000-0000-000000000000	eee6939c-be72-4d5d-9ae8-ad4cfa774b19	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-20 14:57:52.177497+00	
00000000-0000-0000-0000-000000000000	6960ec28-87f1-4924-a255-243f860a2cbb	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-02-20 14:57:57.858962+00	
00000000-0000-0000-0000-000000000000	400d8c31-250c-4a23-9a5f-e1cf2b98014b	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-20 23:46:42.23887+00	
00000000-0000-0000-0000-000000000000	5e0ab6ab-31d6-4163-ab46-a1031277db6a	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-02-20 23:57:02.536949+00	
00000000-0000-0000-0000-000000000000	699f6ba0-ff76-4091-9894-94e5711711b4	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-22 17:36:51.313381+00	
00000000-0000-0000-0000-000000000000	a03d7997-47bf-483f-ad3e-e28a742ba8d7	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-22 18:57:14.623417+00	
00000000-0000-0000-0000-000000000000	ad4ada59-501a-4d34-8e3c-e35f6f1029c8	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-22 18:57:14.628854+00	
00000000-0000-0000-0000-000000000000	bfb1e1a3-e588-4a6b-91de-e136414b93b1	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-02-22 18:58:07.834407+00	
00000000-0000-0000-0000-000000000000	2cd1c70f-8b24-4ef4-a373-6d1fdcdf255c	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-22 19:18:51.222611+00	
00000000-0000-0000-0000-000000000000	98360070-37a3-41f2-937a-edea71d02c84	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-22 20:18:24.875276+00	
00000000-0000-0000-0000-000000000000	a4d1fe1d-a899-4ca0-b1ea-2e221860b3be	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-22 20:18:24.881644+00	
00000000-0000-0000-0000-000000000000	13c9a079-8edc-4aff-a3b0-3bfa1e1b30a0	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 12:36:28.361228+00	
00000000-0000-0000-0000-000000000000	30413334-1aac-459f-a379-4e6d39d721af	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 12:36:28.369902+00	
00000000-0000-0000-0000-000000000000	f0b9e2a4-6310-499a-8969-d430c9f51dc6	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 13:34:56.557413+00	
00000000-0000-0000-0000-000000000000	7f12f91c-64f4-45c2-b64c-5921f571acca	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 13:34:56.567282+00	
00000000-0000-0000-0000-000000000000	5662896a-cecf-430a-a666-ec463a46d415	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-02-23 13:37:57.917687+00	
00000000-0000-0000-0000-000000000000	f3ac43cc-9df7-44c2-b784-a32d7ea6ae93	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-23 13:38:36.14959+00	
00000000-0000-0000-0000-000000000000	0b416063-3889-4f13-b378-4f115618f302	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 15:22:04.825896+00	
00000000-0000-0000-0000-000000000000	e9dc06b7-b39f-47f6-9420-da9d0009d3cd	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 15:22:04.842031+00	
00000000-0000-0000-0000-000000000000	00c5c5bd-f819-46ac-84a7-f2171e8427ec	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 16:51:21.136989+00	
00000000-0000-0000-0000-000000000000	321f8bd5-501e-4b98-bda1-6ef0c56e8e81	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-23 16:51:21.146661+00	
00000000-0000-0000-0000-000000000000	09d5ee81-a93f-4432-8f6d-b19d82c85454	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-02-25 11:49:05.686393+00	
00000000-0000-0000-0000-000000000000	92b018d2-546e-4f0e-9d06-03cf3795796e	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 12:54:18.2121+00	
00000000-0000-0000-0000-000000000000	3c6bf44b-28c8-406f-9a42-e88ff11c9687	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 12:54:18.214238+00	
00000000-0000-0000-0000-000000000000	b0e825f5-09ad-4157-886d-dad49c554fbe	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 13:56:02.583671+00	
00000000-0000-0000-0000-000000000000	ae871201-55ce-437f-9ea1-5020464ac894	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 13:56:02.62375+00	
00000000-0000-0000-0000-000000000000	c7cd5e7e-6508-452b-b3a8-689109798bee	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 18:00:45.569183+00	
00000000-0000-0000-0000-000000000000	7fc67ade-571f-42fa-a30a-ed56faf9710e	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 18:00:45.584275+00	
00000000-0000-0000-0000-000000000000	2a029574-a788-4ad2-9d2b-58ed4ac92889	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 19:51:49.004791+00	
00000000-0000-0000-0000-000000000000	44f8614c-8070-4e68-9ffd-2afd1ef59e85	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-25 19:51:49.014067+00	
00000000-0000-0000-0000-000000000000	93549675-4e9c-4089-adc2-7631e3a64546	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 13:20:41.400096+00	
00000000-0000-0000-0000-000000000000	648d4c49-7b19-4a9b-ad0e-be89f1082140	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 13:20:41.412818+00	
00000000-0000-0000-0000-000000000000	30af24c1-8180-46fc-9ef6-f753cb99a1fb	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 18:47:01.454698+00	
00000000-0000-0000-0000-000000000000	0928e372-ea83-4b39-9c81-718737502a51	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 18:47:01.468721+00	
00000000-0000-0000-0000-000000000000	938e9cd8-8ab9-4e10-966e-adb3edbeca17	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 20:19:36.155201+00	
00000000-0000-0000-0000-000000000000	517a72cb-3b43-43a4-9030-01d894a8a087	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 20:19:36.15591+00	
00000000-0000-0000-0000-000000000000	128ec2c4-8e5a-4485-9903-07f88bbde7ed	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 21:51:23.47728+00	
00000000-0000-0000-0000-000000000000	094001b8-49e4-4ff4-b403-bf21a01137c5	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-26 21:51:23.486086+00	
00000000-0000-0000-0000-000000000000	31b5c24c-7765-4cb9-ad75-e030aed7fd01	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-27 14:12:33.242796+00	
00000000-0000-0000-0000-000000000000	46342678-422e-4d92-91b3-9af14148aac5	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-02-27 14:12:33.252295+00	
00000000-0000-0000-0000-000000000000	052a0868-d8bf-4888-a57e-6cce666974f7	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 11:37:50.464051+00	
00000000-0000-0000-0000-000000000000	1de52744-e3fb-43c8-97aa-8fed8b4c7150	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 11:37:50.474934+00	
00000000-0000-0000-0000-000000000000	46fb7edb-8702-4eb3-beed-46050f43d475	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 12:39:27.138285+00	
00000000-0000-0000-0000-000000000000	ff759c97-54dc-4161-988a-bf1e6518f1cf	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 12:39:27.139045+00	
00000000-0000-0000-0000-000000000000	bb570cde-7ae8-4e3d-bd3e-d7574da3fef7	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 14:45:53.737996+00	
00000000-0000-0000-0000-000000000000	57ab403c-f29a-41ed-9872-16c2afd26253	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 14:45:53.748131+00	
00000000-0000-0000-0000-000000000000	cc669517-a9a1-4942-9a7b-125d9fe05c73	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 15:09:00.040217+00	
00000000-0000-0000-0000-000000000000	82bb0e40-80ea-47ea-b943-88d2840f7d0e	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 15:09:00.042513+00	
00000000-0000-0000-0000-000000000000	1fc4acb9-fe41-456c-a233-cac3308ae37c	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 18:43:52.200893+00	
00000000-0000-0000-0000-000000000000	f9dd4519-a469-4365-a9e2-e0fc072c59f0	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 18:43:52.205365+00	
00000000-0000-0000-0000-000000000000	75f55480-2057-4870-9d3d-69412580b8af	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-02 20:17:17.353857+00	
00000000-0000-0000-0000-000000000000	5e4a7f0a-cae6-4748-9279-74e8d83617f6	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 21:17:49.25348+00	
00000000-0000-0000-0000-000000000000	5a751891-3fd8-4486-ab0a-255813e90116	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-02 21:17:49.259841+00	
00000000-0000-0000-0000-000000000000	a80eccdc-a161-47b4-b237-1de4f62efb18	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-03 02:16:31.772131+00	
00000000-0000-0000-0000-000000000000	b4550dd5-af23-4d90-9c3f-6cd01b0b5e5e	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 03:14:35.961471+00	
00000000-0000-0000-0000-000000000000	9e9a73c5-c95e-4f18-9fab-c56d8ccd2d27	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 03:14:35.964736+00	
00000000-0000-0000-0000-000000000000	d534d8f3-a9c2-40b5-bd79-447c50b9377b	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 04:12:36.040726+00	
00000000-0000-0000-0000-000000000000	0a09c2da-fda4-4841-b7fd-187299308e1d	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 04:12:36.043124+00	
00000000-0000-0000-0000-000000000000	4a54594e-854a-4ebf-8686-f8fbaee02f7d	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 05:11:06.005091+00	
00000000-0000-0000-0000-000000000000	a31793d7-ba4f-4a6f-976f-193ec71c126e	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 05:11:06.006055+00	
00000000-0000-0000-0000-000000000000	77233689-4dce-4592-bc3e-59dc268b05d9	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 06:09:35.692415+00	
00000000-0000-0000-0000-000000000000	5bb80057-1bc1-40a1-91c7-e4de35e3d1d7	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 06:09:35.693607+00	
00000000-0000-0000-0000-000000000000	dca6e572-b6cd-42c8-a68b-b2bef76a86af	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 07:07:35.760558+00	
00000000-0000-0000-0000-000000000000	9cdb590a-aac7-43b2-9af8-1cce307988e5	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 07:07:35.761734+00	
00000000-0000-0000-0000-000000000000	2461ae53-e636-447c-bc65-5fa0cb20ebd6	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 08:05:35.958237+00	
00000000-0000-0000-0000-000000000000	2ca21bee-d629-489e-b755-f6b9b8aa57e7	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 08:05:35.95922+00	
00000000-0000-0000-0000-000000000000	17d1b3db-48ed-4516-98c7-c8aaf4c4d0de	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 09:03:36.379865+00	
00000000-0000-0000-0000-000000000000	e15a867a-8d15-48d7-8168-b06be1089de8	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 09:03:36.381965+00	
00000000-0000-0000-0000-000000000000	d16e6040-936a-42ae-a409-89599681dae9	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 10:02:06.036608+00	
00000000-0000-0000-0000-000000000000	51141b4e-3e95-41e0-9ccb-bf763f6a8c70	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 10:02:06.037601+00	
00000000-0000-0000-0000-000000000000	46157ab2-72fc-4269-b97a-bd96003cf108	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 11:00:36.056057+00	
00000000-0000-0000-0000-000000000000	b0cebb52-b9a5-47dd-b747-52d10653f187	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 11:00:36.057311+00	
00000000-0000-0000-0000-000000000000	83c9be5e-1bf1-4336-b9e3-281f0e2fc15e	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 11:59:06.549341+00	
00000000-0000-0000-0000-000000000000	7198fbb6-0c3f-4e0c-89e8-775ca90e504a	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 11:59:06.551241+00	
00000000-0000-0000-0000-000000000000	de8944c7-4f8e-4803-8502-2d9ae9698dd0	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 12:39:43.440496+00	
00000000-0000-0000-0000-000000000000	6593bb57-2564-4aec-83f1-54cb2324e35c	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 12:39:43.442638+00	
00000000-0000-0000-0000-000000000000	ee6b563c-db25-4355-a201-fe0a2698f96c	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 12:57:29.205247+00	
00000000-0000-0000-0000-000000000000	2c6cb7a6-9244-43ff-9a06-1b8c8af99f08	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 12:57:29.20573+00	
00000000-0000-0000-0000-000000000000	b96dcc71-f8ac-45cb-a4d6-958c2081b3fe	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 13:44:09.166398+00	
00000000-0000-0000-0000-000000000000	f7aa6726-8c90-4f07-97be-8144c6b54d98	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 13:44:09.167169+00	
00000000-0000-0000-0000-000000000000	acf1a584-7771-4319-baf0-bb9540658c55	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 13:55:36.902969+00	
00000000-0000-0000-0000-000000000000	68b03525-4ddb-4ce2-b9ab-811165e37cb7	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 13:55:36.903836+00	
00000000-0000-0000-0000-000000000000	bd45e529-a632-423a-91ef-57fb784fa059	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 14:53:59.355269+00	
00000000-0000-0000-0000-000000000000	1ad70dc0-d97a-4f4a-8924-f73f0991ee03	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 14:53:59.356621+00	
00000000-0000-0000-0000-000000000000	e7ee40b4-da2b-4d6a-8be1-209563338f7d	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 14:55:17.724306+00	
00000000-0000-0000-0000-000000000000	5ff4aa01-119b-4cf5-9758-534cd1b81107	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 14:55:17.725496+00	
00000000-0000-0000-0000-000000000000	93d53007-9766-4da5-835b-1972d061ca3c	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 17:40:18.529636+00	
00000000-0000-0000-0000-000000000000	d566fbe9-153f-44f4-9546-5cee78bcedce	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 17:40:18.540529+00	
00000000-0000-0000-0000-000000000000	3aad228f-6697-4cf2-86fd-995eaaaa5e6c	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 18:49:11.359656+00	
00000000-0000-0000-0000-000000000000	8525d1ad-48a4-4131-b9ac-5b545cfd3027	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 18:49:11.361119+00	
00000000-0000-0000-0000-000000000000	b5f97d13-34ce-4887-88d6-a9dc5c4639fb	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 23:42:19.441655+00	
00000000-0000-0000-0000-000000000000	1c17a1e7-fd18-4a76-aa7e-f5174a3516e5	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-03 23:42:19.449281+00	
00000000-0000-0000-0000-000000000000	3d56a16a-01d0-4874-8603-b9186db418bb	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 12:06:10.194276+00	
00000000-0000-0000-0000-000000000000	924b8eee-ed1c-41d9-bdff-97f7e95cd335	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 12:06:10.200653+00	
00000000-0000-0000-0000-000000000000	6ce0540d-a90c-468a-b989-477df0327f62	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 15:40:50.836701+00	
00000000-0000-0000-0000-000000000000	68d09757-3c36-4a2b-8b4d-8c7855fe89ca	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 15:40:50.847545+00	
00000000-0000-0000-0000-000000000000	916bcd56-d6e5-45dd-8f6a-1ead65e99ef3	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 16:39:07.413378+00	
00000000-0000-0000-0000-000000000000	bca61540-502e-4aa1-8914-089697c61fbe	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 16:39:07.41412+00	
00000000-0000-0000-0000-000000000000	7380517b-6b06-42e3-858c-953465ebf5e8	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 17:37:07.767706+00	
00000000-0000-0000-0000-000000000000	566d5bb5-b2e8-494b-9b0c-f89cc27ac3d9	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 17:37:07.769804+00	
00000000-0000-0000-0000-000000000000	a9230da7-843a-4d29-a14e-5d244d155910	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 18:38:32.686667+00	
00000000-0000-0000-0000-000000000000	02351a66-3405-460a-85da-92b08c405afb	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 18:38:32.687566+00	
00000000-0000-0000-0000-000000000000	2791cec4-ca8f-4c40-aa09-0cdbd9e6453e	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 21:07:46.624687+00	
00000000-0000-0000-0000-000000000000	0236c843-a6ee-43c2-a750-3b853b99e2f5	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 21:07:46.639165+00	
00000000-0000-0000-0000-000000000000	ed5a4020-933c-4a8a-b4aa-a096528bf5d3	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 23:11:25.283809+00	
00000000-0000-0000-0000-000000000000	65bde6ce-0748-4a4c-9ec5-5b721622add9	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-04 23:11:25.2884+00	
00000000-0000-0000-0000-000000000000	c28e4d63-9ee5-47b5-8a3f-d5ec29377188	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 00:12:48.607449+00	
00000000-0000-0000-0000-000000000000	6b200ced-35d2-4247-9b11-b964ce73875a	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 00:12:48.609472+00	
00000000-0000-0000-0000-000000000000	a15a961c-669d-44b4-ae10-d669f1c5968d	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-03-05 00:12:52.764341+00	
00000000-0000-0000-0000-000000000000	e204b403-fc18-4464-abca-001fd5732e45	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-05 00:15:28.826735+00	
00000000-0000-0000-0000-000000000000	7948a461-0700-4360-a3ef-968fbe6126a0	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-05 00:32:48.194847+00	
00000000-0000-0000-0000-000000000000	913d4026-1edc-446d-80a3-2e34ca347c1e	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 11:39:13.546941+00	
00000000-0000-0000-0000-000000000000	5df7ce76-bfc5-4fe6-9d40-7f269017e060	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 11:39:13.551522+00	
00000000-0000-0000-0000-000000000000	08007a46-0a32-4512-b633-f15094b04dc5	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 13:53:26.50558+00	
00000000-0000-0000-0000-000000000000	32039553-16ee-4c49-aa82-2e9c85e270d6	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 13:53:26.517722+00	
00000000-0000-0000-0000-000000000000	7dfc059f-51ca-45d6-9bf3-0ad90e62178e	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 14:53:38.65586+00	
00000000-0000-0000-0000-000000000000	b08f5e49-26dc-44fd-9bde-cddaec55708a	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 14:53:38.656676+00	
00000000-0000-0000-0000-000000000000	08f1b9bc-a2d1-4cc1-b636-3f146217ec79	{"action":"logout","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account"}	2026-03-05 15:45:08.183737+00	
00000000-0000-0000-0000-000000000000	f755deb6-75f0-4998-b7b6-d60a7d905500	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-05 15:45:27.477172+00	
00000000-0000-0000-0000-000000000000	c204205f-0305-40a9-ae5c-0f48b0d3af69	{"action":"user_signedup","actor_id":"8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13","actor_username":"cristobal.cuevasp@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2026-03-05 16:00:15.009787+00	
00000000-0000-0000-0000-000000000000	7f75aeb5-6fe7-411d-9919-5329c5696e8a	{"action":"login","actor_id":"8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13","actor_username":"cristobal.cuevasp@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-05 16:00:15.017534+00	
00000000-0000-0000-0000-000000000000	e3970435-acbc-4b2f-900b-11401b81bc92	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 16:43:41.263224+00	
00000000-0000-0000-0000-000000000000	06105fc0-62de-4631-bc58-c605b9791d63	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 16:43:41.263901+00	
00000000-0000-0000-0000-000000000000	485b0fa6-fae0-42b2-a50e-b9068526a26a	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 17:42:11.809172+00	
00000000-0000-0000-0000-000000000000	caf07a5b-6997-47be-a077-7e38d533379b	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-05 17:42:11.809874+00	
00000000-0000-0000-0000-000000000000	48f781ff-cc8d-4910-b946-f64d2f2a1f33	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-06 23:10:15.456123+00	
00000000-0000-0000-0000-000000000000	697c0cbb-69f9-4db6-b382-871fa0b542aa	{"action":"login","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2026-03-07 00:08:36.572413+00	
00000000-0000-0000-0000-000000000000	4d724b22-b911-4486-b8b3-6af0418d8007	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-07 01:02:03.706484+00	
00000000-0000-0000-0000-000000000000	147dfcc5-e492-44a9-828b-2ad17b1a6b1e	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-07 01:02:03.713873+00	
00000000-0000-0000-0000-000000000000	c793da3d-9cd5-4389-8f44-56fed8244aed	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-09 12:02:12.329844+00	
00000000-0000-0000-0000-000000000000	c11a1d86-f9f5-4e2b-83a3-7eeeff84f655	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-09 12:02:12.371318+00	
00000000-0000-0000-0000-000000000000	7c26363e-4594-40d6-8d26-fe6309a0a1f8	{"action":"token_refreshed","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-10 20:14:02.162015+00	
00000000-0000-0000-0000-000000000000	23a8fd66-0227-40a4-9f94-bcf9b5ef3ca2	{"action":"token_revoked","actor_id":"94f1161f-81d2-444c-873a-e9424e55839f","actor_username":"cr.abarca.a@gmail.com","actor_via_sso":false,"log_type":"token"}	2026-03-10 20:14:02.178867+00	
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
94f1161f-81d2-444c-873a-e9424e55839f	94f1161f-81d2-444c-873a-e9424e55839f	{"sub": "94f1161f-81d2-444c-873a-e9424e55839f", "email": "cr.abarca.a@gmail.com", "nombre": "Cristóbal Abarca", "email_verified": false, "phone_verified": false}	email	2025-11-14 15:01:56.472071+00	2025-11-14 15:01:56.472105+00	2025-11-14 15:01:56.472105+00	1fb3e7f5-7f24-4cd0-9daf-8b038710abf6
3b3c9690-35fd-4d19-950c-8d56f671d5b0	3b3c9690-35fd-4d19-950c-8d56f671d5b0	{"sub": "3b3c9690-35fd-4d19-950c-8d56f671d5b0", "email": "cristopher910@gmail.com", "nombre": "Cristopher Lynch Aguirre", "email_verified": false, "phone_verified": false}	email	2026-01-22 02:19:35.381749+00	2026-01-22 02:19:35.381989+00	2026-01-22 02:19:35.381989+00	0fc80578-9a3f-45eb-8c9b-747d10a4a58e
8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	{"sub": "8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13", "email": "cristobal.cuevasp@gmail.com", "rubro": "freelance", "nombre": "Cristóbal Cuevas", "email_verified": false, "phone_verified": false}	email	2026-03-05 16:00:15.004896+00	2026-03-05 16:00:15.004971+00	2026-03-05 16:00:15.004971+00	90c2c03b-106f-47af-bf47-a2470b0ff919
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
7915dfb8-d6ac-479f-a5ca-512c35ea6f89	2026-01-22 02:19:35.404897+00	2026-01-22 02:19:35.404897+00	password	638ade2f-e71d-4df3-a1af-950bef12a976
2f8cae26-922d-48bd-a2b7-10e134e30230	2026-01-22 02:22:09.149893+00	2026-01-22 02:22:09.149893+00	password	f906094d-06dd-4538-ac69-2d36b5b86321
83c48f35-c53a-40c0-8ece-2998a1b37e21	2026-01-22 02:23:27.524116+00	2026-01-22 02:23:27.524116+00	password	e99f4bd3-ff32-48cb-a33d-053b299a2046
04ce2c56-7c8c-4a1d-a336-8cfcef202274	2026-03-05 15:45:27.4812+00	2026-03-05 15:45:27.4812+00	password	398fc499-dfdf-4b86-9d61-d5969de548e6
850a0176-95dd-41c0-a802-b1db7537fb83	2026-03-05 16:00:15.022194+00	2026-03-05 16:00:15.022194+00	password	6e24d136-e80e-4f8e-834a-8c0c27099d8a
21854b84-ebda-403b-b806-57bf9ae3f8f2	2026-03-06 23:10:15.488688+00	2026-03-06 23:10:15.488688+00	password	7ad826c0-667a-42ef-90ca-74bac60baac8
334c9bfe-8b0e-4bc2-8ba7-b6a22db23ab1	2026-03-07 00:08:36.579988+00	2026-03-07 00:08:36.579988+00	password	91be8334-0298-4dfa-8e5c-6cec3bdcddee
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	88	ysb4htfddzk2	3b3c9690-35fd-4d19-950c-8d56f671d5b0	f	2026-01-22 02:19:35.402483+00	2026-01-22 02:19:35.402483+00	\N	7915dfb8-d6ac-479f-a5ca-512c35ea6f89
00000000-0000-0000-0000-000000000000	89	olqcnz5x7wvs	3b3c9690-35fd-4d19-950c-8d56f671d5b0	f	2026-01-22 02:22:09.147369+00	2026-01-22 02:22:09.147369+00	\N	2f8cae26-922d-48bd-a2b7-10e134e30230
00000000-0000-0000-0000-000000000000	91	qgcu7t32uthz	3b3c9690-35fd-4d19-950c-8d56f671d5b0	f	2026-01-22 02:23:27.521565+00	2026-01-22 02:23:27.521565+00	\N	83c48f35-c53a-40c0-8ece-2998a1b37e21
00000000-0000-0000-0000-000000000000	159	z5s2l2s6jarh	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	f	2026-03-05 16:00:15.019981+00	2026-03-05 16:00:15.019981+00	\N	850a0176-95dd-41c0-a802-b1db7537fb83
00000000-0000-0000-0000-000000000000	158	33dggvdsewuc	94f1161f-81d2-444c-873a-e9424e55839f	t	2026-03-05 15:45:27.480141+00	2026-03-05 16:43:41.264273+00	\N	04ce2c56-7c8c-4a1d-a336-8cfcef202274
00000000-0000-0000-0000-000000000000	160	qookskhig2us	94f1161f-81d2-444c-873a-e9424e55839f	t	2026-03-05 16:43:41.266541+00	2026-03-05 17:42:11.810459+00	33dggvdsewuc	04ce2c56-7c8c-4a1d-a336-8cfcef202274
00000000-0000-0000-0000-000000000000	161	i33bwb7v52hg	94f1161f-81d2-444c-873a-e9424e55839f	f	2026-03-05 17:42:11.810817+00	2026-03-05 17:42:11.810817+00	qookskhig2us	04ce2c56-7c8c-4a1d-a336-8cfcef202274
00000000-0000-0000-0000-000000000000	162	mnp57qak7ips	94f1161f-81d2-444c-873a-e9424e55839f	t	2026-03-06 23:10:15.474789+00	2026-03-07 01:02:03.716967+00	\N	21854b84-ebda-403b-b806-57bf9ae3f8f2
00000000-0000-0000-0000-000000000000	164	elkoo5w565o3	94f1161f-81d2-444c-873a-e9424e55839f	f	2026-03-07 01:02:03.722772+00	2026-03-07 01:02:03.722772+00	mnp57qak7ips	21854b84-ebda-403b-b806-57bf9ae3f8f2
00000000-0000-0000-0000-000000000000	163	zk4c43wqflsz	94f1161f-81d2-444c-873a-e9424e55839f	t	2026-03-07 00:08:36.578001+00	2026-03-09 12:02:12.373772+00	\N	334c9bfe-8b0e-4bc2-8ba7-b6a22db23ab1
00000000-0000-0000-0000-000000000000	165	4mjhftrr76c6	94f1161f-81d2-444c-873a-e9424e55839f	t	2026-03-09 12:02:12.426874+00	2026-03-10 20:14:02.180743+00	zk4c43wqflsz	334c9bfe-8b0e-4bc2-8ba7-b6a22db23ab1
00000000-0000-0000-0000-000000000000	166	olpktk3c77ev	94f1161f-81d2-444c-873a-e9424e55839f	f	2026-03-10 20:14:02.197371+00	2026-03-10 20:14:02.197371+00	4mjhftrr76c6	334c9bfe-8b0e-4bc2-8ba7-b6a22db23ab1
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
850a0176-95dd-41c0-a802-b1db7537fb83	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	2026-03-05 16:00:15.019232+00	2026-03-05 16:00:15.019232+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	181.43.214.128	\N
04ce2c56-7c8c-4a1d-a336-8cfcef202274	94f1161f-81d2-444c-873a-e9424e55839f	2026-03-05 15:45:27.478047+00	2026-03-05 17:42:11.812853+00	\N	aal1	\N	2026-03-05 17:42:11.812795	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	191.113.8.96	\N
21854b84-ebda-403b-b806-57bf9ae3f8f2	94f1161f-81d2-444c-873a-e9424e55839f	2026-03-06 23:10:15.465153+00	2026-03-07 01:02:03.731479+00	\N	aal1	\N	2026-03-07 01:02:03.730851	Mozilla/5.0 (iPhone; CPU iPhone OS 26_4_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/145.0.7632.108 Mobile/15E148 Safari/604.1	179.60.64.189	\N
334c9bfe-8b0e-4bc2-8ba7-b6a22db23ab1	94f1161f-81d2-444c-873a-e9424e55839f	2026-03-07 00:08:36.575904+00	2026-03-10 20:14:02.223792+00	\N	aal1	\N	2026-03-10 20:14:02.223577	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	191.113.26.244	\N
83c48f35-c53a-40c0-8ece-2998a1b37e21	3b3c9690-35fd-4d19-950c-8d56f671d5b0	2026-01-22 02:23:27.519022+00	2026-01-22 02:23:27.519022+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1	186.11.110.56	\N
7915dfb8-d6ac-479f-a5ca-512c35ea6f89	3b3c9690-35fd-4d19-950c-8d56f671d5b0	2026-01-22 02:19:35.400207+00	2026-01-22 02:19:35.400207+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1	186.11.110.56	\N
2f8cae26-922d-48bd-a2b7-10e134e30230	3b3c9690-35fd-4d19-950c-8d56f671d5b0	2026-01-22 02:22:09.145228+00	2026-01-22 02:22:09.145228+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1	186.11.110.56	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	94f1161f-81d2-444c-873a-e9424e55839f	authenticated	authenticated	cr.abarca.a@gmail.com	$2a$10$DoqfaMjy0lbugsVT.0eU4..GAfNPeuhDbfBtxtFMOOeucwUYXkRlW	2025-11-14 15:01:56.477257+00	\N		\N		\N			\N	2026-03-07 00:08:36.575813+00	{"provider": "email", "providers": ["email"]}	{"sub": "94f1161f-81d2-444c-873a-e9424e55839f", "email": "cr.abarca.a@gmail.com", "nombre": "Cristóbal Abarca", "email_verified": true, "phone_verified": false}	\N	2025-11-14 15:01:56.463897+00	2026-03-10 20:14:02.206413+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	3b3c9690-35fd-4d19-950c-8d56f671d5b0	authenticated	authenticated	cristopher910@gmail.com	$2a$10$kgUbMunGT84PaMgboQ5fHODxnRqrOGDLzBOo4MsHBsz1sLca0cDxW	2026-01-22 02:19:35.387438+00	\N		\N		\N			\N	2026-01-22 02:23:27.518936+00	{"provider": "email", "providers": ["email"]}	{"sub": "3b3c9690-35fd-4d19-950c-8d56f671d5b0", "email": "cristopher910@gmail.com", "nombre": "Cristopher Lynch Aguirre", "email_verified": true, "phone_verified": false}	\N	2026-01-22 02:19:35.329561+00	2026-01-22 02:23:27.523695+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	authenticated	authenticated	cristobal.cuevasp@gmail.com	$2a$10$InZNLaLp3q/EZS0ojtIVxOM1UfmyEFSL2g4zqbup3f.WQoahy0LMu	2026-03-05 16:00:15.010314+00	\N		\N		\N			\N	2026-03-05 16:00:15.019127+00	{"provider": "email", "providers": ["email"]}	{"sub": "8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13", "email": "cristobal.cuevasp@gmail.com", "rubro": "freelance", "nombre": "Cristóbal Cuevas", "email_verified": true, "phone_verified": false}	\N	2026-03-05 16:00:14.965537+00	2026-03-05 16:00:15.021732+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: -
--

COPY pgsodium.key (id, status, created, expires, key_type, key_id, key_context, name, associated_data, raw_key, raw_key_nonce, parent_key, comment, user_data) FROM stdin;
\.


--
-- Data for Name: ai_usage_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_usage_logs (id, usuario_id, tipo_operacion, tokens_entrada, tokens_salida, modelo, rubro_contexto, exitoso, error_mensaje, created_at) FROM stdin;
\.


--
-- Data for Name: cliente_etiquetas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cliente_etiquetas (cliente_id, etiqueta_id) FROM stdin;
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clientes (id, usuario_id, nombre, email, telefono, empresa, direccion, created_at, updated_at, rut, industria, fuente, etapa_ciclo, avatar_url, notas, sitio_web, valor_total) FROM stdin;
68066600-9a65-483e-afbd-6a2b82b8acdc	94f1161f-81d2-444c-873a-e9424e55839f	Sebastian Arellano	s.arevillouta@gmail.com	+56961585497	Sebastian Arellano	NA	2025-12-16 01:12:00.922613+00	2025-12-18 20:06:49.083882+00	16.923.391-8	\N	directo	lead	\N	\N	\N	0.00
484991d8-71d8-4ca7-bedd-0637bf9ae725	94f1161f-81d2-444c-873a-e9424e55839f	Claudia Zuñiga	cl.zunigag@gmail.com		spk2u		2026-01-21 12:29:02.654775+00	2026-01-21 12:29:02.654775+00		\N	directo	lead	\N	\N	\N	0.00
70b9cdf8-9570-4a10-9009-1abbb46fb81c	94f1161f-81d2-444c-873a-e9424e55839f	Leyla Facuse	lmfacuse@gmail.com	+56953639816	Nutricionista Leyla Facuse	\N	2026-02-19 18:52:28.043904+00	2026-02-26 20:20:07.039519+00	\N	\N	directo	lead	\N	\N	\N	0.00
\.


--
-- Data for Name: contratos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contratos (id, usuario_id, cliente_id, titulo, descripcion, valor, moneda, estado, fecha_inicio, fecha_fin, renovacion_auto, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: documentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documentos (id, usuario_id, cliente_id, nombre, url, tipo_mime, tamano_bytes, created_at) FROM stdin;
\.


--
-- Data for Name: equipo_miembros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipo_miembros (id, equipo_id, user_id, rol, created_at) FROM stdin;
\.


--
-- Data for Name: equipos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipos (id, nombre, owner_id, created_at) FROM stdin;
\.


--
-- Data for Name: estimaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estimaciones (id, proyecto_id, titulo, total_horas, costo_total, complejidad, nivel_confianza, riesgos, suposiciones, es_elegida, created_at, costo_hora) FROM stdin;
24ddcef7-fdee-40b9-bdb3-124266d73537	8705672e-5d10-4845-a3ed-8138777192b2	Alcance Completo	110	1100000	media	medio	["Escalabilidad del Chat en Tiempo Real: Un alto volumen de usuarios concurrentes podría requerir optimizaciones de infraestructura y código para mantener la fluidez.", "Complejidad de la Lógica de Asignación y Cola: La implementación eficiente de la cola de espera y el algoritmo de asignación de profesionales puede ser más compleja de lo previsto.", "Precisión y Rendimiento de KPIs: La recolección y cálculo de KPIs en tiempo real para los dashboards podría presentar desafíos de rendimiento y precisión de datos."]	["Los diseños UX/UI provistos son completos y no requerirán iteraciones de diseño significativas; las horas son solo para implementación frontend.", "El 'Sistema de Post' mencionado en la descripción se refiere a notas o registros internos asociados a las sesiones o perfiles de usuario, no a un sistema de blog público.", "No se requieren integraciones con sistemas de terceros para historial médico externo, videollamadas o cualquier otra funcionalidad no especificada.", "La gestión de anuncios es un CRUD simple, sin complejidades como segmentación avanzada de audiencia o sistemas de puja."]	t	2026-01-22 01:44:07.771789+00	10000
4d60610e-bd4a-4b10-b53a-99edfcbd89d0	eec343e7-90e2-4b3c-ac0b-3155ab310279	Alcance Completo	163	733500	alta	medio	["La integración con Flycrew sin API nativa presenta un alto riesgo de estabilidad, mantenimiento y dependencia de cambios en la UI/UX de Flycrew.", "La precisión y el rendimiento del modelo de IA y el sistema RAG dependen de la calidad y cantidad de los manuales proporcionados y pueden requerir ajustes iterativos.", "La dependencia de APIs externas (WhatsApp, Visión Computacional) introduce un riesgo de cambios, interrupciones o limitaciones que pueden afectar la funcionalidad del bot."]	["Los manuales del programa del cliente se proporcionarán en un formato estructurado y parseable (e.g., texto plano, PDF con texto seleccionable) para la ingestión en el sistema RAG.", "Se proporcionarán las credenciales y el acceso necesario para la configuración e integración con la API de WhatsApp Business.", "Flycrew es una plataforma web a la que se puede acceder mediante automatización (web scraping o emulación de navegador), asumiendo que las protecciones anti-bot son manejables.", "La lógica de negocio específica para la generación de pautas nutricionales (cálculos, reglas, contenido) será definida y documentada detalladamente por el cliente.", "La API de Visión Computacional externa seleccionada será capaz de identificar y analizar de manera efectiva los elementos relevantes en las imágenes de platos de comida.", "El costo de 100000 se refiere a costos fijos de servicios o licencias y no se contabiliza como horas de desarrollo."]	t	2026-02-25 18:38:57.337746+00	4500
63d2a609-32b9-437e-a0bb-b3c2a63292a5	88358ca7-b067-42ed-8567-ecacedf03377	Alcance Completo	131	392738	media	medio	["La funcionalidad de 'Homenajes Virtuales' implica la gestión de contenido generado por usuarios (imágenes, mensajes) lo que podría requerir moderación y validación, aumentando la complejidad y el riesgo de seguridad si no se gestiona adecuadamente.", "Riesgos de rendimiento en la carga de imágenes y contenido dinámico si no se implementan optimizaciones adecuadas.", "Posibles requisitos adicionales no especificados para la gestión y seguridad del identificador único de cada difunto en el módulo de homenajes virtuales."]	["Se utilizará un CMS headless o un framework que permita la gestión de contenido dinámico de forma eficiente.", "Las imágenes y textos de contenido serán proporcionados por el cliente antes del inicio de la fase de maquetación y desarrollo.", "El widget de WhatsApp es un plugin estándar y bien documentado, no requiriendo desarrollo a medida de la integración de la API.", "La identificación del difunto para la página de homenaje se realizará mediante un ID único generado por el sistema, con acceso por link/token, y la subida de contenido (imágenes, mensajes) se manejará a través de formularios en esa misma página o un mecanismo simple de envío, sin requerir un sistema completo de autenticación de múltiples usuarios para los contribuyentes.", "El blog no requiere funcionalidades avanzadas como comentarios de usuarios, múltiples categorías o autores complejos."]	t	2026-03-10 20:22:42.637848+00	2998
ee9a5b5d-6f8a-44aa-ae00-e0fa2926f19b	f92decad-6731-44b6-8df8-c9d2a9dab400	Estimación Base (Desde Presupuesto)	1	148401	media	alto	\N	\N	t	2026-03-10 20:59:32.657503+00	148401
\.


--
-- Data for Name: etiquetas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.etiquetas (id, usuario_id, nombre, color, created_at) FROM stdin;
\.


--
-- Data for Name: facturas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.facturas (id, usuario_id, cliente_id, presupuesto_id, numero, titulo, subtotal, iva_porcentaje, iva_monto, total, moneda, estado, fecha_emision, fecha_vencimiento, notas, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: items_factura; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items_factura (id, factura_id, descripcion, cantidad, precio_unitario, total, orden, created_at) FROM stdin;
\.


--
-- Data for Name: items_presupuesto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items_presupuesto (id, presupuesto_id, descripcion, cantidad, precio_unitario, total, orden, created_at) FROM stdin;
ec6a0020-06b5-472c-9296-3a2cc23623b3	cecd260b-f232-486f-8323-0714c6f69863	Modelado de Base de Datos	1	50000	50000	0	2026-01-22 02:22:44.779548+00
e69cfcee-a585-4ec6-a0f2-4d59c145297c	cecd260b-f232-486f-8323-0714c6f69863	Despliegue Productivo	1	20000	20000	1	2026-01-22 02:22:44.779548+00
3563a4b4-3378-40be-80b7-07a2178f784f	cecd260b-f232-486f-8323-0714c6f69863	Autenticación de Usuarios	1	80000	80000	2	2026-01-22 02:22:44.779548+00
fd188faf-9a57-45f4-8021-1af22903fa27	cecd260b-f232-486f-8323-0714c6f69863	Configuración de Servidor y Entorno	1	50000	50000	3	2026-01-22 02:22:44.779548+00
2ec1258d-87f5-4fdf-a38d-bbdacbb27bf4	cecd260b-f232-486f-8323-0714c6f69863	Sistema de Cola de Espera y Notificaciones	1	70000	70000	4	2026-01-22 02:22:44.779548+00
1395d78d-c073-4210-b307-7b1013a87bbc	cecd260b-f232-486f-8323-0714c6f69863	Backend Lógica de Administrador y KPIs	1	100000	100000	5	2026-01-22 02:22:44.779548+00
7a90192c-833c-43fb-aa53-c61f73e46a4f	cecd260b-f232-486f-8323-0714c6f69863	Frontend Dashboards y Gestión Admin	1	80000	80000	6	2026-01-22 02:22:44.779548+00
85627be0-f82f-4e42-9f8f-61018d3ab0cd	cecd260b-f232-486f-8323-0714c6f69863	Maquetación Base Frontend General	1	80000	80000	7	2026-01-22 02:22:44.779548+00
c08ab989-f334-4d44-b055-0f1f271fbea7	cecd260b-f232-486f-8323-0714c6f69863	Corrección de Errores y Ajustes Finales	1	50000	50000	8	2026-01-22 02:22:44.779548+00
bb57d571-53ae-4834-9e6f-a8ffe87f6aaf	cecd260b-f232-486f-8323-0714c6f69863	Gestión de Perfiles y Roles	1	70000	70000	9	2026-01-22 02:22:44.779548+00
7a3b7df9-f4e9-4e25-ac20-819a6e759945	cecd260b-f232-486f-8323-0714c6f69863	Lógica Backend Chat en Tiempo Real	1	100000	100000	10	2026-01-22 02:22:44.779548+00
840abfdf-9643-4bd5-82bf-12bc5280ce5a	cecd260b-f232-486f-8323-0714c6f69863	Interfaz Frontend Chat en Tiempo Real	1	100000	100000	11	2026-01-22 02:22:44.779548+00
80bd5008-f62b-4575-a712-0717f64b8146	cecd260b-f232-486f-8323-0714c6f69863	Testing Funcional y QA	1	80000	80000	12	2026-01-22 02:22:44.779548+00
b6f97257-849a-482d-9c98-e9b87573f863	cecd260b-f232-486f-8323-0714c6f69863	Gestión de Intereses de Usuario	1	50000	50000	13	2026-01-22 02:22:44.779548+00
84cc068d-6e6b-46bf-9503-9f9b2f625ff2	cecd260b-f232-486f-8323-0714c6f69863	Gestión de Anuncios y Publicidad	1	60000	60000	14	2026-01-22 02:22:44.779548+00
bab76864-2e24-4d9b-8481-626c22741655	cecd260b-f232-486f-8323-0714c6f69863	Adaptabilidad Responsive	1	60000	60000	15	2026-01-22 02:22:44.779548+00
6ff6dcc2-bb34-42f2-ad15-cad1125aa5c2	e7b8c77c-e46d-4942-bf69-3b75351a8588	Frontend Core & Layout	1	47968	47968	0	2026-03-10 20:24:34.665179+00
d94c44c5-a4df-4d1b-ad67-cd81bc40b2f1	e7b8c77c-e46d-4942-bf69-3b75351a8588	Gestión de Contenidos (CMS Backend)	1	50966	50966	1	2026-03-10 20:24:34.665179+00
2ca18b82-19c3-457c-a055-b3ee22e44457	e7b8c77c-e46d-4942-bf69-3b75351a8588	Infraestructura y Despliegue	1	32978	32978	2	2026-03-10 20:24:34.665179+00
6835e308-6026-488a-9123-d6dab8fe7961	e7b8c77c-e46d-4942-bf69-3b75351a8588	Control de Calidad (QA) y Cierre	1	35976	35976	3	2026-03-10 20:24:34.665179+00
e0df20ba-debd-4fe8-afe6-5521cbb7fe92	e7b8c77c-e46d-4942-bf69-3b75351a8588	Sección Planes Funerarios (Visualización Frontend)	1	23984	23984	4	2026-03-10 20:24:34.665179+00
1399d011-ee09-42ce-9e53-f36b4e06a6de	e7b8c77c-e46d-4942-bf69-3b75351a8588	Módulo Homenajes Virtuales (Obituarios Digitales)	1	164890	164890	5	2026-03-10 20:24:34.665179+00
f0aaeeb1-7069-4035-918c-02338bf75081	e7b8c77c-e46d-4942-bf69-3b75351a8588	Integración Widget WhatsApp Flotante	1	20986	20986	6	2026-03-10 20:24:34.665179+00
4dd1dc0c-b09a-4775-a564-a2f8a4148214	e7b8c77c-e46d-4942-bf69-3b75351a8588	Sección Blog (Visualización Frontend)	1	14990	14990	7	2026-03-10 20:24:34.665179+00
09eaf3e7-e300-4ab4-8e17-0d0f5121534c	db366b26-dd8e-4e38-b86d-26c18a732473	Módulo Homenajes Virtuales (Obituarios Digitales)	1	164890	164890	0	2026-03-10 20:59:27.969817+00
fbe9a97f-1b45-4b42-b284-d306ebb22288	e64b5017-4417-452b-8775-06ab2fc3f9fd	Modelado y Desarrollo de BBDD Relacional	1	49500	49500	0	2026-02-25 18:44:45.974642+00
b0123ef8-5dc4-438e-85c2-6d8a2dbf206a	e64b5017-4417-452b-8775-06ab2fc3f9fd	Integración con API de WhatsApp Business	1	36000	36000	1	2026-02-25 18:44:45.974642+00
a8dc7554-11f4-4ec8-a37a-93054498071d	e64b5017-4417-452b-8775-06ab2fc3f9fd	Integración Custom Flycrew para Validación de Suscriptores	1	67500	67500	2	2026-02-25 18:44:45.974642+00
9ac47f3e-d717-4996-a5da-4fe8a1cbb19c	e64b5017-4417-452b-8775-06ab2fc3f9fd	Configuración de Infraestructura y Despliegue	1	58500	58500	3	2026-02-25 18:44:45.974642+00
c81a4d96-1739-4f84-adc7-928a447c2b1b	e64b5017-4417-452b-8775-06ab2fc3f9fd	Testing, Correcciones y Validación Final	1	62998	62998	4	2026-02-25 18:44:45.974642+00
9a3fe85b-6069-42ce-818e-7d877a4872ee	e64b5017-4417-452b-8775-06ab2fc3f9fd	Costos de API - Infraestructura	1	100000	100000	5	2026-02-25 18:44:45.974642+00
f40046fb-30b6-4b5c-8308-3be8e85e880a	e64b5017-4417-452b-8775-06ab2fc3f9fd	Análisis de Imágenes de Alimentos con Visión Computacional	1	108000	108000	6	2026-02-25 18:44:45.974642+00
b8dc3599-9d0b-414f-bc75-00cead4a6dc4	e64b5017-4417-452b-8775-06ab2fc3f9fd	Desarrollo de Agente IA RAG y Flujos Conversacionales	1	117000	117000	7	2026-02-25 18:44:45.974642+00
643e21a3-0851-4795-a527-1ba51563c112	e64b5017-4417-452b-8775-06ab2fc3f9fd	Implementación de Sistema  para Contexto Nutricional	1	100000	100000	8	2026-02-25 18:44:45.974642+00
893a1cfd-9246-4ace-873a-e198b4b65d54	e64b5017-4417-452b-8775-06ab2fc3f9fd	Generación y Envío Automatizado de Pautas Nutricionales (PDF)	1	75000	75000	9	2026-02-25 18:44:45.974642+00
27d2b865-b14f-47d8-9828-8ae7b5c470d9	e64b5017-4417-452b-8775-06ab2fc3f9fd	Panel de Administración y Visualización de Chats/Pautas	1	95000	95000	10	2026-02-25 18:44:45.974642+00
\.


--
-- Data for Name: modulos_estimacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modulos_estimacion (id, estimacion_id, nombre, descripcion, horas_estimadas, prioridad, nivel_riesgo, justificacion, estado, es_excluido, created_at, costo_fijo, cantidad) FROM stdin;
95a08edd-99e0-451f-9f6e-4791a3bfe3ab	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Frontend Core & Layout	\N	16	1	bajo	Incluye maquetación de barra superior, encabezado, menú principal, pie de página, estructura general de la home y adaptación a diseño responsive. Componentes estándar de un sitio web corporativo.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
c8f9e221-2040-4243-93c2-cc850db83eba	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Gestión de Contenidos (CMS Backend)	\N	17	1	medio	Modelado de base de datos para Planes, Servicios, Productos, Contenido General y Artículos de Blog. Desarrollo de endpoints CRUD para la administración de estos contenidos dinámicos y lógica de negocio para su correcta visualización.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
ba98d0a5-11fe-48c7-9d9c-25a249bfbc89	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Infraestructura y Despliegue	\N	11	1	medio	Configuración del servidor de producción, despliegue de la aplicación, y establecimiento de un pipeline de Integración Continua/Despliegue Continuo (CI/CD) para futuras actualizaciones.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
d4f739c8-268b-4f72-b5e6-2786e6582796	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Control de Calidad (QA) y Cierre	\N	12	1	bajo	Ejecución de pruebas funcionales exhaustivas, gestión y corrección de defectos encontrados, y validación final del cumplimiento de requisitos y estabilidad del sistema antes de la puesta en producción.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
62ac0aa6-6a22-4e7d-b905-7a8b57e453e8	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Sección Planes Funerarios (Visualización Frontend)	\N	8	2	bajo	Desarrollo de la interfaz de usuario para mostrar los planes funerarios en formato de grilla/carrusel, incluyendo tarjetas con precios y descripciones, y enlaces a detalles específicos de cada plan.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
87dc6c8b-2f4c-40ef-b448-6f7915b942fd	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Módulo Homenajes Virtuales (Obituarios Digitales)	\N	55	2	alto	Implementación de páginas dedicadas por difunto con un identificador único, funcionalidad de subida y visualización de imágenes, y una sección de mensajes interactiva. Incluye modelado de datos, endpoints CRUD específicos, lógica de negocio para la asociación de contenido y gestión de accesos por link/token.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
67a8fefd-c8fe-4b2c-80bd-ddfaaae881fd	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Integración Widget WhatsApp Flotante	\N	7	2	bajo	Integración y configuración de un plugin/widget flotante de WhatsApp para contacto rápido, incluyendo personalización de mensajes y conexión con los números de teléfono especificados.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
a7cb2ba7-2ade-41ea-8b2a-9b5492664208	63d2a609-32b9-437e-a0bb-b3c2a63292a5	Sección Blog (Visualización Frontend)	\N	5	3	bajo	Desarrollo de la interfaz para mostrar las últimas publicaciones del blog en la página principal, incluyendo títulos y un enlace para ver el blog completo. El backend del blog está cubierto en 'Gestión de Contenidos'.	pendiente	f	2026-03-10 20:22:42.832618+00	0	1
bba942a0-adf8-4917-9b7f-3c78e569cf44	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Modelado y Desarrollo de BBDD Relacional	\N	9	1	medio	Diseño y desarrollo de la estructura de datos para usuarios, pautas nutricionales, contexto de chat e historial, incluyendo endpoints CRUD esenciales para la gestión de datos.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
b3a1b3d9-76ab-4137-82a9-196721e5de7e	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Desarrollo de Agente IA y Flujos Conversacionales (n8n)	\N	39	2	alto	Configuración del LLM base, diseño e implementación de la lógica conversacional compleja y manejo de estados dentro de n8n, esencial para la interacción del chatbot y optimización de prompts.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
c552275e-0fcf-4932-8cac-94a4ddc168a0	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Implementación de Sistema RAG para Contexto Nutricional	\N	10	2	medio	Desarrollo del pipeline de ingesta de manuales del cliente, vectorización, almacenamiento y recuperación de información para contextualizar las respuestas del bot de manera precisa.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
08c98c10-c431-4ddb-8762-d86c9bf75164	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Integración Custom Flycrew para Validación de Suscriptores	\N	20	1	alto	Desarrollo de una solución personalizada para validar la membresía de suscriptores activos en Flycrew, con complejidad elevada debido a la ausencia de una API nativa que requiere web scraping o emulación de sesión.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
b0aab941-64a7-440c-83d2-0fd980aad2c1	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Generación y Envío Automatizado de Pautas Nutricionales (PDF)	\N	14	2	medio	Implementación de la lógica para capturar datos biométricos mediante formulario, generar pautas nutricionales personalizadas en formato PDF y enviarlas automáticamente por correo electrónico.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
daf60722-d1c3-466c-8e26-76c818dfebd0	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Análisis de Imágenes de Alimentos con Visión Computacional	\N	12	2	medio	Integración con un servicio de visión computacional externo para analizar imágenes de platos de comida, interpretar los resultados y validarlos contra la pauta nutricional individual del usuario.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
bdefca05-35cf-4adf-ad9a-61bf626aa777	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Panel de Administración y Visualización de Chats/Pautas	\N	21	3	bajo	Desarrollo de una interfaz de usuario web para que los administradores puedan monitorear conversaciones, gestionar usuarios y consultar pautas nutricionales asignadas, con maquetación y responsive design.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
a515c680-a7e0-40fb-829f-1244ede64eb4	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Configuración de Infraestructura y Despliegue	\N	11	1	bajo	Preparación del entorno de servidor, automatización del despliegue en producción y configuración de un pipeline CI/CD básico para asegurar la entrega continua y estable.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
229ca300-4c81-41ad-ba39-9b0e9f030511	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Testing, Correcciones y Validación Final	\N	14	1	medio	Ejecución de pruebas funcionales exhaustivas para todos los módulos, resolución de errores detectados y validación final de todas las funcionalidades antes de la entrega productiva.	pendiente	f	2026-02-25 18:38:57.484691+00	0	1
3c885d18-e070-4b61-ba5a-1fe07af090cd	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Costos de Servicios Externos/Licencias	\N	0	1	bajo	Representa los costos operativos o de licencias de servicios externos proporcionados explícitamente en el requerimiento para el funcionamiento del proyecto.	pendiente	f	2026-02-25 18:38:57.484691+00	100000	1
53da8f5e-2a88-44df-8b55-f3d88e69654c	4d60610e-bd4a-4b10-b53a-99edfcbd89d0	Integración con API de WhatsApp Business	\N	13	1	medio	Configuración y desarrollo de la conexión bidireccional con la plataforma de WhatsApp Business para la recepción y envío de mensajes, incluyendo manejo de webhooks y formateo de mensajes.	completado	f	2026-02-25 18:38:57.484691+00	0	1
fe5369ad-294c-4979-aceb-737f65eaed44	ee9a5b5d-6f8a-44aa-ae00-e0fa2926f19b	Módulo Homenajes Virtuales (Obituarios Digitales)	Item del presupuesto: Módulo Homenajes Virtuales (Obituarios Digitales)	1	2	\N	\N	pendiente	f	2026-03-10 20:59:32.795877+00	0	1
44a5ac64-a08e-46a4-a744-7d1c9a763334	24ddcef7-fdee-40b9-bdb3-124266d73537	Modelado de Base de Datos	\N	5	1	bajo	Diseño de esquema de base de datos para usuarios, roles, sesiones de chat, mensajes, intereses, anuncios y métricas de KPIs.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
02289a26-bcc3-4318-98fd-872f392597ca	24ddcef7-fdee-40b9-bdb3-124266d73537	Autenticación de Usuarios	\N	8	1	bajo	Implementación de registro y login seguros para Pacientes, Profesionales y Administradores.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
4ba2e877-7bc3-43c4-b79e-bd129fe71d3e	24ddcef7-fdee-40b9-bdb3-124266d73537	Gestión de Perfiles y Roles	\N	7	2	bajo	Creación de perfiles para cada tipo de usuario (Paciente, Profesional, Admin) con campos y permisos específicos.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
46af7f58-1cf2-4699-b362-5ab99c3065bf	24ddcef7-fdee-40b9-bdb3-124266d73537	Lógica Backend Chat en Tiempo Real	\N	10	2	medio	Desarrollo de la lógica de websockets para comunicación bidireccional, gestión de sesiones y almacenamiento de mensajes.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
a3ae707e-50d0-4a5c-8c8d-8f19741bd12f	24ddcef7-fdee-40b9-bdb3-124266d73537	Interfaz Frontend Chat en Tiempo Real	\N	10	2	bajo	Implementación de la interfaz de usuario para el chat, incluyendo envío y recepción de mensajes, y estados de conexión.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
3eb3ff63-c9fa-4fc6-b7cc-d48113027c7d	24ddcef7-fdee-40b9-bdb3-124266d73537	Sistema de Cola de Espera y Notificaciones	\N	7	2	medio	Lógica para gestionar la cola de pacientes, asignación a profesionales disponibles y visualización de consejos de salud durante la espera.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
d4cfab69-8e44-49a8-b656-dcdd4dbfb3c7	24ddcef7-fdee-40b9-bdb3-124266d73537	Backend Lógica de Administrador y KPIs	\N	10	2	bajo	Desarrollo de la lógica para calcular y exponer KPIs (duración de chat, tiempos de respuesta), actividades recientes y gestión de usuarios/anuncios.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
5c25b263-9631-4495-bc72-818420cc875f	24ddcef7-fdee-40b9-bdb3-124266d73537	Frontend Dashboards y Gestión Admin	\N	8	2	bajo	Implementación de las interfaces de administración con dashboards interactivos para la visualización de KPIs y herramientas de gestión.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
6d2b27bd-8b20-4183-92ea-e7251e5d4748	24ddcef7-fdee-40b9-bdb3-124266d73537	Gestión de Anuncios y Publicidad	\N	6	3	bajo	Implementación de un CRUD para que el administrador gestione anuncios y lógica para su visualización en el frontend.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
34345085-aa74-4809-80b0-1057b2f8c8a3	24ddcef7-fdee-40b9-bdb3-124266d73537	Gestión de Intereses de Usuario	\N	5	3	bajo	Desarrollo de la funcionalidad para que los usuarios puedan seleccionar y gestionar sus intereses, y su almacenamiento en la BBDD.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
0b45debd-6d7c-42b1-bd4e-3632f4f97206	24ddcef7-fdee-40b9-bdb3-124266d73537	Maquetación Base Frontend General	\N	8	2	bajo	Implementación de la estructura general de la interfaz de usuario, navegación y elementos comunes basada en los diseños provistos.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
f7889a21-9259-428f-9dd0-a988e2d6a25c	24ddcef7-fdee-40b9-bdb3-124266d73537	Adaptabilidad Responsive	\N	6	3	bajo	Ajuste de estilos CSS y componentes para garantizar una correcta visualización y funcionalidad en diferentes dispositivos (móvil, tablet, desktop).	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
fa42327c-1ddd-4e70-95b1-36fc91d8018a	24ddcef7-fdee-40b9-bdb3-124266d73537	Configuración de Servidor y Entorno	\N	5	1	bajo	Setup inicial del servidor, configuración de base de datos y variables de entorno para los ambientes de desarrollo y producción.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
c41a1829-c3db-454d-993b-048fa7cbbf0a	24ddcef7-fdee-40b9-bdb3-124266d73537	Despliegue Productivo	\N	2	1	bajo	Proceso de despliegue de la aplicación a producción, configuración de dominio y certificado SSL.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
42005533-cb51-4cfd-ba6d-5a620f24510c	24ddcef7-fdee-40b9-bdb3-124266d73537	Testing Funcional y QA	\N	8	2	bajo	Ejecución de pruebas exhaustivas para verificar la correcta funcionalidad de todos los módulos, roles y flujos de usuario.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
05c7d36e-ed1d-40a5-921b-e9ddf91fad55	24ddcef7-fdee-40b9-bdb3-124266d73537	Corrección de Errores y Ajustes Finales	\N	5	2	bajo	Resolución de bugs y aplicación de ajustes menores detectados durante la fase de testing para estabilizar la aplicación.	pendiente	f	2026-01-22 01:44:07.911771+00	0	1
\.


--
-- Data for Name: newsletter_nexabis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.newsletter_nexabis (id, email, fecha_registro) FROM stdin;
\.


--
-- Data for Name: notas_cliente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notas_cliente (id, usuario_id, cliente_id, contenido, tipo, created_at) FROM stdin;
\.


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificaciones (id, usuario_id, presupuesto_id, tipo, mensaje, visto, created_at) FROM stdin;
\.


--
-- Data for Name: oportunidades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.oportunidades (id, usuario_id, cliente_id, etapa_id, titulo, valor, moneda, probabilidad, fecha_cierre_esperada, notas, estado, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagos (id, usuario_id, cliente_id, presupuesto_id, factura_id, monto, moneda, metodo_pago, referencia, mp_payment_id, estado, fecha_pago, notas, created_at, updated_at) FROM stdin;
236a413a-aab1-4107-be21-ae2c863eb2c5	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	e64b5017-4417-452b-8775-06ab2fc3f9fd	\N	391274.00	CLP	mercadopago	148799632124	\N	completado	2026-03-04 00:00:00+00	Cuota 1/2 del presupuesto	2026-03-04 18:43:24.687664+00	2026-03-04 18:43:24.687664+00
\.


--
-- Data for Name: pipeline_etapas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pipeline_etapas (id, usuario_id, nombre, color, orden, created_at) FROM stdin;
3cf98ef5-403b-4397-a0f3-98fc7c37b8ae	94f1161f-81d2-444c-873a-e9424e55839f	Prospección	#6366f1	0	2026-03-04 12:07:00.02267+00
32185f15-e049-4c08-a8aa-66f5904fa4e3	94f1161f-81d2-444c-873a-e9424e55839f	Contacto	#8b5cf6	1	2026-03-04 12:07:00.02267+00
6b060cb9-4fa6-4e5d-9002-145550620a3a	94f1161f-81d2-444c-873a-e9424e55839f	Propuesta	#f59e0b	2	2026-03-04 12:07:00.02267+00
8b59a388-bf25-4fed-b581-0e0f99a912bb	94f1161f-81d2-444c-873a-e9424e55839f	Negociación	#f97316	3	2026-03-04 12:07:00.02267+00
c9c29936-b187-4cde-a36f-5a62a4d7e21b	94f1161f-81d2-444c-873a-e9424e55839f	Cierre	#22c55e	4	2026-03-04 12:07:00.02267+00
a17083b4-6491-41a1-b7aa-7ea77cd2e4e6	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	Prospección	#6366f1	0	2026-03-05 16:16:16.7447+00
a15259d6-9eae-4ada-9250-b1c419e779a0	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	Contacto	#8b5cf6	1	2026-03-05 16:16:16.7447+00
ac92ff5b-442a-4c23-afbc-4c5e119a1fa6	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	Propuesta	#f59e0b	2	2026-03-05 16:16:16.7447+00
263a14a0-2737-43fc-8192-88ad5b27aea3	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	Negociación	#f97316	3	2026-03-05 16:16:16.7447+00
f2384d7d-f26c-4bf7-84a0-9b008d2a8ff8	8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	Cierre	#22c55e	4	2026-03-05 16:16:16.7447+00
\.


--
-- Data for Name: posibles_clientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posibles_clientes (email, empresa, nombre, mensaje, hora_registro, telefono) FROM stdin;
\.


--
-- Data for Name: presupuestos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.presupuestos (id, usuario_id, cliente_id, numero, codigo_auto, titulo, fecha, validez_dias, fecha_vencimiento, subtotal, descuento_tipo, descuento_valor, descuento_total, iva_porcentaje, iva_monto, total, moneda, estado, forma_pago, terminos, notas_trabajo, promocion_aplicada, comentarios_cliente, token, modo_impresion, created_at, updated_at, proyecto_id, mp_pago_1_monto, mp_pago_1_id, mp_pago_1_status, mp_pago_1_fecha, mp_pago_2_monto, mp_pago_2_id, mp_pago_2_status, mp_pago_2_fecha) FROM stdin;
cecd260b-f232-486f-8323-0714c6f69863	94f1161f-81d2-444c-873a-e9424e55839f	484991d8-71d8-4ca7-bedd-0637bf9ae725	NEX-2026-0004	NEX-2026-0004	Presupuesto para Proyecto software - 21/1/2026	2026-01-22	15	2026-02-06	1100000	\N	0	0	19	209000	1100000	CLP	rechazado	50% anticipo, 50% contra entrega	Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.	Pagina-App web para sesiones psicologicas mediante chat en tiempo real. Sistemas de roles, donde pueda ingresar el Paciente, Profesional de Salud y un administrador. Sistema de Post, Cola de espera para esperar al profesional disponible. La web cuenta con sistema de intereses para el usuario. Sing Up - Sing In. En las esperas deberá mostrar consejos de Salud. Dashboards con KPIS, (Duracion de Chat, tiempos de respuesta promedio, etc). Actividades recientes, pacientes. Maqueta UX/UI ya lista, asi que descartar de las horas. Se debe añadir un apartado para anuncios y publicidad.	\N	\N	0dc08efc-f18d-4b7b-af8e-e71ae5a6c8d3	dark	2026-01-22 02:22:44.623816+00	2026-02-26 13:21:14.188122+00	8705672e-5d10-4845-a3ed-8138777192b2	\N	\N	\N	\N	\N	\N	\N	\N
e64b5017-4417-452b-8775-06ab2fc3f9fd	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	NEX-2026-0006	NEX-2026-0006	Presupuesto para Proyecto ChatBot Nutricional Mediante WhatsApp y Solución generadora de Pautas nutricionales. - 25/2/2026	2026-02-25	20	2026-03-17	869498	porcentaje	10	86949.8	19	165204.62	782548.2	CLP	aprobado	50% anticipo, 50% contra entrega	Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.	Desarrollar un asistente inteligente por WhatsApp integrado nativamente con Flycrew (no tiene API) para una comunidad de salud. El sistema validará automáticamente a los suscriptores activos para permitirles realizar consultas técnicas y recibir análisis de platos de comida mediante visión computacional. Utilizando un modelo de IA personalizada (RAG), el bot responderá dudas basadas estrictamente en los manuales del programa del cliente. La solución se implementará mediante n8n, ofreciendo una alternativa robusta y escalable frente a plataformas cerradas, con un enfoque en la propiedad de los datos y eficiencia en costos operativos. Este ecosistema integra un módulo de generación y consulta de pautas nutricionales personalizadas mediante un flujo automatizado. El sistema captura datos biométricos vía formulario para generar automáticamente una pauta única en PDF y enviarla de forma inmediata por correo electrónico. Una vez asignada y almacenada en una base de datos relacional, el chatbot identifica al usuario de WhatsApp, consulta su pauta específica y utiliza esa información como contexto exclusivo para validar sus consultas y fotos de alimentos, asegurando que cada respuesta sea coherente con el plan nutricional individual del paciente.	\N	\N	c5eb2dcd-46c6-4060-b304-a5386a44eae4	dark	2026-02-25 18:44:45.667947+00	2026-03-04 18:43:24.844378+00	eec343e7-90e2-4b3c-ac0b-3155ab310279	391274.00	\N	approved	\N	\N	\N	\N	\N
e7b8c77c-e46d-4942-bf69-3b75351a8588	94f1161f-81d2-444c-873a-e9424e55839f	68066600-9a65-483e-afbd-6a2b82b8acdc	NEX-2026-0007	NEX-2026-0007	Presupuesto para Proyecto Sitio Web - 10/3/2026	2026-03-10	15	2026-03-25	392738	porcentaje	10	39273.8	19	74620.22	353464.2	CLP	pendiente	50% anticipo, 50% contra entrega	Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.	Diseño y Navegación: Crear interfaz empática con barra superior fija (contacto 24/7) y menú principal desplegable.\n\nInicio (Hero y Planes): Maquetar banner principal interactivo y una grilla con los 5 planes funerarios, precios y detalles.\n\nContenido Informativo: Desarrollar las secciones de "Propuesta de valor", "Guía paso a paso" y carruseles de productos/alianzas.\n\nBlog y Footer: Integrar las últimas noticias, pie de página, botón para subir y widget flotante de WhatsApp.\n\nBackend Memorial (Nuevo): Diseñar una base de datos que asigne un ID único y URL exclusiva a cada difunto.\n\nFrontend Memorial (Nuevo): Programar un formulario de subida de fotos y un muro de condolencias vinculado únicamente al ID del difunto.	\N	\N	639c0f8f-4413-4c52-90f0-7dca62f47cd8	dark	2026-03-10 20:24:34.470359+00	2026-03-10 20:24:34.470359+00	88358ca7-b067-42ed-8567-ecacedf03377	\N	\N	\N	\N	\N	\N	\N	\N
db366b26-dd8e-4e38-b86d-26c18a732473	94f1161f-81d2-444c-873a-e9424e55839f	68066600-9a65-483e-afbd-6a2b82b8acdc	NEX-2026-0008	NEX-2026-0008	Modulo Web Obituario Digital	2026-03-10	15	2026-03-25	164890	porcentaje	10	16489	19	31329.100000000002	148401	CLP	pendiente	50% anticipo, 50% contra entrega	Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.	Backend Memorial (Nuevo): Diseñar una base de datos que asigne un ID único y URL exclusiva a cada difunto.\n\nFrontend Memorial (Nuevo): Programar un formulario de subida de fotos y un muro de condolencias vinculado únicamente al ID del difunto.	\N	\N	24ca5f07-7d35-4596-a58d-6b731b34ae7a	dark	2026-03-10 20:59:27.802463+00	2026-03-10 20:59:32.937324+00	f92decad-6731-44b6-8df8-c9d2a9dab400	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, nombre, email, rut, nombre_empresa, logo_url, direccion, telefono, plantilla_tyc, moneda_predeterminada, activo, created_at, updated_at, equipo_id, subscription_tier, subscription_status, trial_ends_at, subscription_current_period_end, subscription_cancel_at_period_end, subscription_external_id, subscription_provider, rubro, max_presupuestos_mes, email_empresa) FROM stdin;
3b3c9690-35fd-4d19-950c-8d56f671d5b0	Cristopher Lynch Aguirre	cristopher910@gmail.com	\N	\N	\N	\N	\N	Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.	CLP	t	2026-01-22 02:19:35.328899+00	2026-02-22 17:28:57.649602+00	\N	premium	active	\N	\N	f	\N	\N	tecnologia	5	\N
94f1161f-81d2-444c-873a-e9424e55839f	Cristóbal Abarca	cr.abarca.a@gmail.com	\N	Nexabis Technologies	https://supabase.nexabistech.com/storage/v1/object/public/logos/94f1161f-81d2-444c-873a-e9424e55839f/logo.png	\N	+56986343217	Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.	CLP	t	2025-11-14 15:01:56.463352+00	2026-03-03 15:47:08.310248+00	\N	premium	active	\N	\N	f	\N	\N	tecnologia	5	contacto@nexabistech.com
8a62cd38-9d8e-4cb7-80e1-bc792c1f4f13	Cristóbal Cuevas	cristobal.cuevasp@gmail.com	\N	\N	\N	\N	\N	Los presupuestos son válidos por el tiempo especificado. Se requiere anticipo del 50% para comenzar el proyecto.	CLP	t	2026-03-05 16:00:14.964791+00	2026-03-05 16:00:15.218308+00	\N	free	trial	2026-03-19 16:00:14.964791+00	\N	f	\N	\N	freelance	5	\N
\.


--
-- Data for Name: promociones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promociones (id, nombre, descripcion, descuento_porcentaje, monto_minimo, fecha_inicio, fecha_fin, activa, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: proyectos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proyectos (id, usuario_id, cliente_id, nombre, descripcion, tipo, urgencia, presupuesto_cliente, estado, created_at, updated_at) FROM stdin;
8705672e-5d10-4845-a3ed-8138777192b2	94f1161f-81d2-444c-873a-e9424e55839f	484991d8-71d8-4ca7-bedd-0637bf9ae725	Proyecto software - 21/1/2026	Pagina-App web para sesiones psicologicas mediante chat en tiempo real. Sistemas de roles, donde pueda ingresar el Paciente, Profesional de Salud y un administrador. Sistema de Post, Cola de espera para esperar al profesional disponible. La web cuenta con sistema de intereses para el usuario. Sing Up - Sing In. En las esperas deberá mostrar consejos de Salud. Dashboards con KPIS, (Duracion de Chat, tiempos de respuesta promedio, etc). Actividades recientes, pacientes. Maqueta UX/UI ya lista, asi que descartar de las horas. Se debe añadir un apartado para anuncios y publicidad.	software		\N	cancelado	2026-01-22 01:44:07.570704+00	2026-02-26 13:21:30.154367+00
eec343e7-90e2-4b3c-ac0b-3155ab310279	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	Proyecto ChatBot Nutricional Mediante WhatsApp y Solución generadora de Pautas nutricionales. - 25/2/2026	Desarrollar un asistente inteligente por WhatsApp integrado nativamente con Flycrew (no tiene API) para una comunidad de salud. El sistema validará automáticamente a los suscriptores activos para permitirles realizar consultas técnicas y recibir análisis de platos de comida mediante visión computacional. Utilizando un modelo de IA personalizada (RAG), el bot responderá dudas basadas estrictamente en los manuales del programa del cliente. La solución se implementará mediante n8n, ofreciendo una alternativa robusta y escalable frente a plataformas cerradas, con un enfoque en la propiedad de los datos y eficiencia en costos operativos. Este ecosistema integra un módulo de generación y consulta de pautas nutricionales personalizadas mediante un flujo automatizado. El sistema captura datos biométricos vía formulario para generar automáticamente una pauta única en PDF y enviarla de forma inmediata por correo electrónico. Una vez asignada y almacenada en una base de datos relacional, el chatbot identifica al usuario de WhatsApp, consulta su pauta específica y utiliza esa información como contexto exclusivo para validar sus consultas y fotos de alimentos, asegurando que cada respuesta sea coherente con el plan nutricional individual del paciente.	ChatBot Nutricional Mediante WhatsApp y Solución generadora de Pautas nutricionales.	media	\N	activo	2026-02-25 18:38:57.182528+00	2026-03-04 15:45:15.101098+00
88358ca7-b067-42ed-8567-ecacedf03377	94f1161f-81d2-444c-873a-e9424e55839f	68066600-9a65-483e-afbd-6a2b82b8acdc	Proyecto Sitio Web - 10/3/2026	1. Propósito y Enfoque\nEs un sitio web corporativo y de servicios enfocado en el rubro funerario. Su diseño está orientado a transmitir empatía, respeto y facilidad de contacto ante situaciones de emergencia (duelo). Tiene un fuerte enfoque en la conversión rápida (botones de WhatsApp, teléfonos visibles y planes con precios claros).\n\n2. Barra Superior (Top Bar) y Encabezado (Header)\nEsta sección está fija y diseñada para el contacto inmediato.\n\nAviso destacado: "Atendemos 24/7 - ¡Siempre los primeros en estar!"\n\nContacto rápido: * WhatsApp: +56 9 9264 5091\n\nTeléfonos fijos: +562 27354496 / +562 27777994\n\nLogo: Ubicado a la izquierda (Corpus Christi Funeraria).\n\n3. Menú de Navegación (Principal)\nEl menú está estructurado de la siguiente manera, incluyendo submenús (desplegables):\n\nInicio\n\nServicios (Desplegable)\n\nPlanes (Desplegable con 5 opciones): Plan ESENCIAL, Plan SERENIDAD, Plan TRANQUILIDAD, Plan HOMENAJE, Plan ETERNIDAD.\n\nÁnforas\n\nTraslados\n\nRepatriación\n\nUrnas\n\nNosotros (Desplegable): Acerca de Nosotros, Nuestro Blog.\n\nContacto\n\n4. Estructura de la Página Principal (Home - Scroll hacia abajo)\nA. Banner Principal (Hero Section)\n\nEslogan / Título: "HOY, JUNTOS MAÑANA EN PAZ"\n\nLlamado a la acción (CTA): Un botón principal que dice "VER PLANES".\n\nFondo: (Seguramente una imagen sobria y respetuosa relacionada con la paz o el acompañamiento).\n\nB. Sección de Planes Funerarios (Catálogo tipo grilla/carrusel)\n\nTítulo: "Explora nuestros planes funerarios"\n\nSubtítulo: "Conoce todos nuestros planes disponibles y elige el que mejor se adapta para tu familia."\n\nTarjetas de Planes (Incluyen precio y breve descripción):\n\nPlan Esencial: Desde $790.000 CLP (Servicios básicos).\n\nPlan Serenidad: Desde $1.142.302 CLP (Equilibrio).\n\nPlan Tranquilidad: Desde $1.890.000 CLP (Servicio completo).\n\nPlan Homenaje: Desde $2.690.000 CLP (Despedida especial).\n\nPlan Eternidad: Desde $3.260.000 CLP (Servicio integral).\n\nCada tarjeta tiene un enlace: "Ver más detalles del plan".\n\nC. Propuesta de Valor ("¿Por qué elegirnos?")\n\nTítulo: "¿Por qué optar por un servicio con nosotros?"\n\nSe divide en 3 pilares con íconos o bloques de texto:\n\nTransparencia y Honestidad: Costos y procesos claros.\n\nAtención Personalizada: Apoyo emocional y adaptación a cada familia.\n\nExperiencia y Trayectoria: Respaldo de "más de 80 años de experiencia".\n\nD. Guía de Proceso (Paso a Paso numerado)\n\nTítulo: "¿Cuál es el proceso para despedir a tu ser querido?"\n\nPasos:\n\nPaso 1: Obtener certificado médico de defunción.\n\nPaso 2: Decidir lugar de velación y tipo de despedida.\n\nPaso 3: Adquirir uno de los planes disponibles.\n\nPaso 4: Velación.\n\nPaso 5: Ceremonia de sepultación o cremación.\n\nLlamado a la acción: Botón "Quiero contactarme".\n\nE. Carruseles Sociales y de Alianzas\n\nCementerios Asociados: Un carrusel de logos de cementerios con los que trabajan.\n\nHomenajes Virtuales: Nombres de personas (Lucia, Julia, Raúl, etc.) con un botón que lleva a "Visitar Memorial Virtual" (una funcionalidad de obituario digital).\n\nF. Carrusel de Productos y Servicios Adicionales\nUn deslizador de imágenes con:\n\nUrnas\n\nServicio de velación\n\nArreglos Florales\n\nCoronas de Caridad\n\nLibro de Condolencias\n\nTarjetas de Agradecimiento\n\nG. Sección de Blog / Artículos ("Últimas Publicaciones")\n\nMuestra las 3 últimas entradas para SEO y ayuda al usuario:\n\n"Guía legal ante la muerte de PERSONAS QUERIDAS"\n\n"La Muerte y el Duelo"\n\n"Sobreviviendo a NUESTROS HIJOS"\n\nBotón "Ver más" para ir al blog completo.\n\n5. Pie de Página (Footer) y Elementos Flotantes\nRedes Sociales: Enlaces a Facebook e Instagram.\n\nCopyright: "Copyright © 2024".\n\nWidget de WhatsApp (Flotante): Utilizan un plugin (probablemente NinjaTeam WhatsApp Chat) que muestra el mensaje emergente: "Hola, ¿en qué te podemos ayudar? El equipo responderá en pocos minutos. O llámanos al 2 735 4496".\n\nBotón "Scroll to top": Para volver rápidamente arriba.\n\n\nSECCION NUEVA: \n\nuna sección en la que se puedan subir imagenes del difunto y sección de mensajes a la familia afectada... (se debe identificar el diunto (debe haber un identificador) para que la pagina del difunto sea solo para él. sus mensajes e imagenes deben estar relacionadas a el.	Sitio Web	baja	\N	borrador	2026-03-10 20:22:42.378956+00	2026-03-10 20:22:42.378956+00
f92decad-6731-44b6-8df8-c9d2a9dab400	94f1161f-81d2-444c-873a-e9424e55839f	68066600-9a65-483e-afbd-6a2b82b8acdc	Modulo Web Obituario Digital	Proyecto generado a partir del presupuesto #NEX-2026-0008	Web	\N	148401	activo	2026-03-10 20:59:32.509352+00	2026-03-10 20:59:32.509352+00
\.


--
-- Data for Name: tareas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tareas (id, usuario_id, cliente_id, oportunidad_id, proyecto_id, titulo, descripcion, tipo, prioridad, estado, fecha_vencimiento, fecha_completada, created_at, updated_at, modulo_id) FROM stdin;
9788f670-9ce9-49c2-a74a-1b8431c3cb48	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Integración Custom Flycrew para Validación de Suscriptores	Desarrollo de una solución personalizada para validar la membresía de suscriptores activos en Flycrew, con complejidad elevada debido a la ausencia de una API nativa que requiere web scraping o emulación de sesión.	tarea	urgente	to_do	\N	\N	2026-03-05 15:19:08.965138+00	2026-03-05 15:19:08.965138+00	08c98c10-c431-4ddb-8762-d86c9bf75164
e7213bb2-78c6-4514-902b-e69b02456ae1	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Configuración de Infraestructura y Despliegue	Preparación del entorno de servidor, automatización del despliegue en producción y configuración de un pipeline CI/CD básico para asegurar la entrega continua y estable.	tarea	urgente	to_do	\N	\N	2026-03-05 15:19:09.189071+00	2026-03-05 15:19:09.189071+00	a515c680-a7e0-40fb-829f-1244ede64eb4
f9ab7524-90c0-42f5-a2d4-a3f86f6cc1d5	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Testing, Correcciones y Validación Final	Ejecución de pruebas funcionales exhaustivas para todos los módulos, resolución de errores detectados y validación final de todas las funcionalidades antes de la entrega productiva.	tarea	urgente	to_do	\N	\N	2026-03-05 15:19:09.410882+00	2026-03-05 15:19:09.410882+00	229ca300-4c81-41ad-ba39-9b0e9f030511
80ece3e1-5141-4c1c-b300-c5f456dc0c6e	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Costos de Servicios Externos/Licencias	Representa los costos operativos o de licencias de servicios externos proporcionados explícitamente en el requerimiento para el funcionamiento del proyecto.	tarea	urgente	to_do	\N	\N	2026-03-05 15:19:09.626475+00	2026-03-05 15:19:09.626475+00	3c885d18-e070-4b61-ba5a-1fe07af090cd
19526d4c-0566-465a-8b27-838bd2ac3b78	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Análisis de Imágenes de Alimentos con Visión Computacional	Integración con un servicio de visión computacional externo para analizar imágenes de platos de comida, interpretar los resultados y validarlos contra la pauta nutricional individual del usuario.	tarea	alta	to_do	\N	\N	2026-03-05 15:19:09.832708+00	2026-03-05 15:19:09.832708+00	daf60722-d1c3-466c-8e26-76c818dfebd0
4537f1e1-6813-457c-8cc5-e5164a90dd8b	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Desarrollo de Agente IA y Flujos Conversacionales (n8n)	Configuración del LLM base, diseño e implementación de la lógica conversacional compleja y manejo de estados dentro de n8n, esencial para la interacción del chatbot y optimización de prompts.	tarea	alta	to_do	\N	\N	2026-03-05 15:19:10.039891+00	2026-03-05 15:19:10.039891+00	b3a1b3d9-76ab-4137-82a9-196721e5de7e
7c986b35-a01d-4700-8a09-39ccc3efcdde	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Implementación de Sistema RAG para Contexto Nutricional	Desarrollo del pipeline de ingesta de manuales del cliente, vectorización, almacenamiento y recuperación de información para contextualizar las respuestas del bot de manera precisa.	tarea	alta	to_do	\N	\N	2026-03-05 15:19:10.245504+00	2026-03-05 15:19:10.245504+00	c552275e-0fcf-4932-8cac-94a4ddc168a0
8470794c-2a02-4db3-867d-c4e5f7f6cd4a	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Generación y Envío Automatizado de Pautas Nutricionales (PDF)	Implementación de la lógica para capturar datos biométricos mediante formulario, generar pautas nutricionales personalizadas en formato PDF y enviarlas automáticamente por correo electrónico.	tarea	alta	to_do	\N	\N	2026-03-05 15:19:10.45398+00	2026-03-05 15:19:10.45398+00	b0aab941-64a7-440c-83d2-0fd980aad2c1
3972a050-9a7d-48a8-82c4-05f2e3e3dc44	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Panel de Administración y Visualización de Chats/Pautas	Desarrollo de una interfaz de usuario web para que los administradores puedan monitorear conversaciones, gestionar usuarios y consultar pautas nutricionales asignadas, con maquetación y responsive design.	tarea	media	to_do	\N	\N	2026-03-05 15:19:10.658224+00	2026-03-05 15:19:10.658224+00	bdefca05-35cf-4adf-ad9a-61bf626aa777
880b82ed-13c3-4cbc-b350-f1868b7a70d8	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Modelado y Desarrollo de BBDD Relacional	Diseño y desarrollo de la estructura de datos para usuarios, pautas nutricionales, contexto de chat e historial, incluyendo endpoints CRUD esenciales para la gestión de datos.	tarea	urgente	to_do	\N	\N	2026-03-05 15:19:08.535823+00	2026-03-05 15:43:29.746752+00	bba942a0-adf8-4917-9b7f-3c78e569cf44
1b466cbf-a309-4ff4-83d7-1d739dca6adf	94f1161f-81d2-444c-873a-e9424e55839f	70b9cdf8-9570-4a10-9009-1abbb46fb81c	\N	eec343e7-90e2-4b3c-ac0b-3155ab310279	[Módulo] Integración con API de WhatsApp Business	Configuración y desarrollo de la conexión bidireccional con la plataforma de WhatsApp Business para la recepción y envío de mensajes, incluyendo manejo de webhooks y formateo de mensajes.	tarea	urgente	done	\N	2026-03-05 15:46:16.506448+00	2026-03-05 15:19:08.753214+00	2026-03-05 15:46:16.506448+00	53da8f5e-2a88-44df-8b55-f3d88e69654c
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role, created_at) FROM stdin;
1d45b164-e7a9-44c0-9c79-1e0990f74473	94f1161f-81d2-444c-873a-e9424e55839f	admin	2025-11-14 15:02:23.037961+00
\.


--
-- Data for Name: usuarios_permitidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios_permitidos (id, email, activo, invitado_por, fecha_invitacion, created_at) FROM stdin;
d1d6dfcf-a7ac-4c5e-b7d0-64162ad6f859	cr.abarca.a@gmail.com	t	\N	2025-11-14 14:56:56.873951+00	2025-11-14 14:56:56.873951+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-11-14 14:54:58
20211116045059	2025-11-14 14:54:58
20211116050929	2025-11-14 14:54:58
20211116051442	2025-11-14 14:54:58
20211116212300	2025-11-14 14:54:58
20211116213355	2025-11-14 14:54:58
20211116213934	2025-11-14 14:54:58
20211116214523	2025-11-14 14:54:58
20211122062447	2025-11-14 14:54:58
20211124070109	2025-11-14 14:54:58
20211202204204	2025-11-14 14:54:58
20211202204605	2025-11-14 14:54:58
20211210212804	2025-11-14 14:54:58
20211228014915	2025-11-14 14:54:58
20220107221237	2025-11-14 14:54:58
20220228202821	2025-11-14 14:54:58
20220312004840	2025-11-14 14:54:58
20220603231003	2025-11-14 14:54:58
20220603232444	2025-11-14 14:54:58
20220615214548	2025-11-14 14:54:58
20220712093339	2025-11-14 14:54:58
20220908172859	2025-11-14 14:54:58
20220916233421	2025-11-14 14:54:58
20230119133233	2025-11-14 14:54:58
20230128025114	2025-11-14 14:54:58
20230128025212	2025-11-14 14:54:58
20230227211149	2025-11-14 14:54:58
20230228184745	2025-11-14 14:54:58
20230308225145	2025-11-14 14:54:58
20230328144023	2025-11-14 14:54:58
20231018144023	2025-11-14 14:54:58
20231204144023	2025-11-14 14:54:58
20231204144024	2025-11-14 14:54:58
20231204144025	2025-11-14 14:54:58
20240108234812	2025-11-14 14:54:58
20240109165339	2025-11-14 14:54:58
20240227174441	2025-11-14 14:54:58
20240311171622	2025-11-14 14:54:58
20240321100241	2025-11-14 14:54:58
20240401105812	2025-11-14 14:54:58
20240418121054	2025-11-14 14:54:58
20240523004032	2025-11-14 14:54:58
20240618124746	2025-11-14 14:54:58
20240801235015	2025-11-14 14:54:58
20240805133720	2025-11-14 14:54:58
20240827160934	2025-11-14 14:54:58
20240919163303	2025-11-14 14:54:58
20240919163305	2025-11-14 14:54:58
20241019105805	2025-11-14 14:54:58
20241030150047	2025-11-14 14:54:58
20241108114728	2025-11-14 14:54:58
20241121104152	2025-11-14 14:54:58
20241130184212	2025-11-14 14:54:58
20241220035512	2025-11-14 14:54:58
20241220123912	2025-11-14 14:54:58
20241224161212	2025-11-14 14:54:58
20250107150512	2025-11-14 14:54:58
20250110162412	2025-11-14 14:54:58
20250123174212	2025-11-14 14:54:58
20250128220012	2025-11-14 14:54:58
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id) FROM stdin;
logos	logos	\N	2025-11-14 14:56:35.853471+00	2025-11-14 14:56:35.853471+00	t	f	5242880	{image/jpeg,image/png,image/webp,image/svg+xml}	\N
files	files	\N	2026-01-23 17:02:24.53051+00	2026-01-23 17:02:24.53051+00	f	f	\N	\N	\N
documentos	documentos	\N	2026-03-03 23:40:30.242633+00	2026-03-03 23:40:30.242633+00	f	f	10485760	{application/pdf,image/jpeg,image/png,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv}	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-11-14 14:54:43.164038
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-11-14 14:54:43.189819
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-11-14 14:54:43.201882
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-11-14 14:54:43.270787
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-11-14 14:54:43.355771
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-11-14 14:54:43.379043
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-11-14 14:54:43.408044
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-11-14 14:54:43.428844
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-11-14 14:54:43.449791
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-11-14 14:54:43.474026
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-11-14 14:54:43.509065
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-11-14 14:54:43.549083
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-11-14 14:54:43.612913
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-11-14 14:54:43.641195
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-11-14 14:54:43.679838
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-11-14 14:54:43.892511
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-11-14 14:54:43.939631
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-11-14 14:54:43.966122
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-11-14 14:54:44.003479
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-11-14 14:54:44.058746
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-11-14 14:54:44.089721
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-11-14 14:54:44.133094
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-11-14 14:54:44.218189
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-11-14 14:54:44.29489
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-11-14 14:54:44.337982
25	custom-metadata	67eb93b7e8d401cafcdc97f9ac779e71a79bfe03	2025-11-14 14:54:44.366044
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
88f15e3d-c882-416a-80ff-e8af4b6f793c	files	CEO-Prompts.pdf	\N	2026-01-23 17:03:15.18303+00	2026-01-23 17:03:15.18303+00	2026-01-23 17:03:15.18303+00	{"eTag": "\\"e409741c2ff1f83636cf48f868b72644-1\\"", "size": 960073, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-01-23T17:03:15.000Z", "contentLength": 960073, "httpStatusCode": 200}	e656c155-8729-4b11-a9bc-0057cfbdd38d	\N	\N
ddfe9ee8-b8b4-4fd1-94bf-fa78f66cf8d1	logos	94f1161f-81d2-444c-873a-e9424e55839f/logo.png	94f1161f-81d2-444c-873a-e9424e55839f	2026-02-23 12:48:39.599868+00	2026-02-23 12:48:39.599868+00	2026-02-23 12:48:39.599868+00	{"eTag": "\\"367abd9678a81e2703a2723bddea10df\\"", "size": 505574, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-02-23T12:48:39.000Z", "contentLength": 505574, "httpStatusCode": 200}	ab2ddc84-8914-4860-9c6a-59e5d46cecf8	94f1161f-81d2-444c-873a-e9424e55839f	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY supabase_functions.hooks (id, hook_table_id, hook_name, created_at, request_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY supabase_functions.migrations (version, inserted_at) FROM stdin;
initial	2025-11-14 14:54:04.686083+00
20210809183423_update_grants	2025-11-14 14:54:04.686083+00
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 166, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: -
--

SELECT pg_catalog.setval('pgsodium.key_key_id_seq', 1, false);


--
-- Name: newsletter_nexabis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.newsletter_nexabis_id_seq', 3, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: -
--

SELECT pg_catalog.setval('supabase_functions.hooks_id_seq', 1, false);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ai_usage_logs ai_usage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_pkey PRIMARY KEY (id);


--
-- Name: cliente_etiquetas cliente_etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiquetas
    ADD CONSTRAINT cliente_etiquetas_pkey PRIMARY KEY (cliente_id, etiqueta_id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: equipo_miembros equipo_miembros_equipo_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_equipo_id_user_id_key UNIQUE (equipo_id, user_id);


--
-- Name: equipo_miembros equipo_miembros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_pkey PRIMARY KEY (id);


--
-- Name: equipos equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_pkey PRIMARY KEY (id);


--
-- Name: estimaciones estimaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimaciones
    ADD CONSTRAINT estimaciones_pkey PRIMARY KEY (id);


--
-- Name: etiquetas etiquetas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_pkey PRIMARY KEY (id);


--
-- Name: etiquetas etiquetas_usuario_id_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_usuario_id_nombre_key UNIQUE (usuario_id, nombre);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: items_factura items_factura_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items_factura
    ADD CONSTRAINT items_factura_pkey PRIMARY KEY (id);


--
-- Name: items_presupuesto items_presupuesto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items_presupuesto
    ADD CONSTRAINT items_presupuesto_pkey PRIMARY KEY (id);


--
-- Name: modulos_estimacion modulos_estimacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modulos_estimacion
    ADD CONSTRAINT modulos_estimacion_pkey PRIMARY KEY (id);


--
-- Name: newsletter_nexabis newsletter_nexabis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_nexabis
    ADD CONSTRAINT newsletter_nexabis_pkey PRIMARY KEY (id);


--
-- Name: notas_cliente notas_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_cliente
    ADD CONSTRAINT notas_cliente_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: oportunidades oportunidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_pkey PRIMARY KEY (id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: pipeline_etapas pipeline_etapas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_etapas
    ADD CONSTRAINT pipeline_etapas_pkey PRIMARY KEY (id);


--
-- Name: posibles_clientes posibles_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posibles_clientes
    ADD CONSTRAINT posibles_clientes_pkey PRIMARY KEY (email, empresa, telefono);


--
-- Name: presupuestos presupuestos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: promociones promociones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promociones
    ADD CONSTRAINT promociones_pkey PRIMARY KEY (id);


--
-- Name: proyectos proyectos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_pkey PRIMARY KEY (id);


--
-- Name: tareas tareas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: usuarios_permitidos usuarios_permitidos_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_permitidos
    ADD CONSTRAINT usuarios_permitidos_email_key UNIQUE (email);


--
-- Name: usuarios_permitidos usuarios_permitidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_permitidos
    ADD CONSTRAINT usuarios_permitidos_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks
    ADD CONSTRAINT hooks_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_ai_usage_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_created_at ON public.ai_usage_logs USING btree (created_at);


--
-- Name: idx_ai_usage_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_usage_usuario_id ON public.ai_usage_logs USING btree (usuario_id);


--
-- Name: idx_cliente_etiquetas_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliente_etiquetas_cliente ON public.cliente_etiquetas USING btree (cliente_id);


--
-- Name: idx_cliente_etiquetas_etiqueta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cliente_etiquetas_etiqueta ON public.cliente_etiquetas USING btree (etiqueta_id);


--
-- Name: idx_clientes_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_email ON public.clientes USING btree (email);


--
-- Name: idx_clientes_etapa_ciclo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_etapa_ciclo ON public.clientes USING btree (etapa_ciclo);


--
-- Name: idx_clientes_fuente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_fuente ON public.clientes USING btree (fuente);


--
-- Name: idx_clientes_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_usuario_id ON public.clientes USING btree (usuario_id);


--
-- Name: idx_contratos_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_cliente_id ON public.contratos USING btree (cliente_id);


--
-- Name: idx_contratos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_estado ON public.contratos USING btree (estado);


--
-- Name: idx_contratos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contratos_usuario_id ON public.contratos USING btree (usuario_id);


--
-- Name: idx_documentos_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_cliente_id ON public.documentos USING btree (cliente_id);


--
-- Name: idx_facturas_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_cliente_id ON public.facturas USING btree (cliente_id);


--
-- Name: idx_facturas_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_estado ON public.facturas USING btree (estado);


--
-- Name: idx_facturas_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_numero ON public.facturas USING btree (numero);


--
-- Name: idx_facturas_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facturas_usuario_id ON public.facturas USING btree (usuario_id);


--
-- Name: idx_items_factura_factura_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_factura_factura_id ON public.items_factura USING btree (factura_id);


--
-- Name: idx_items_presupuesto_presupuesto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_presupuesto_presupuesto_id ON public.items_presupuesto USING btree (presupuesto_id);


--
-- Name: idx_notas_cliente_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notas_cliente_cliente_id ON public.notas_cliente USING btree (cliente_id);


--
-- Name: idx_notificaciones_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificaciones_usuario_id ON public.notificaciones USING btree (usuario_id);


--
-- Name: idx_notificaciones_visto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificaciones_visto ON public.notificaciones USING btree (visto);


--
-- Name: idx_oportunidades_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oportunidades_cliente_id ON public.oportunidades USING btree (cliente_id);


--
-- Name: idx_oportunidades_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oportunidades_estado ON public.oportunidades USING btree (estado);


--
-- Name: idx_oportunidades_etapa_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oportunidades_etapa_id ON public.oportunidades USING btree (etapa_id);


--
-- Name: idx_oportunidades_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_oportunidades_usuario_id ON public.oportunidades USING btree (usuario_id);


--
-- Name: idx_pagos_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_cliente_id ON public.pagos USING btree (cliente_id);


--
-- Name: idx_pagos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_estado ON public.pagos USING btree (estado);


--
-- Name: idx_pagos_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_fecha ON public.pagos USING btree (fecha_pago);


--
-- Name: idx_pagos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagos_usuario_id ON public.pagos USING btree (usuario_id);


--
-- Name: idx_pipeline_etapas_orden; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipeline_etapas_orden ON public.pipeline_etapas USING btree (orden);


--
-- Name: idx_pipeline_etapas_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipeline_etapas_usuario_id ON public.pipeline_etapas USING btree (usuario_id);


--
-- Name: idx_presupuestos_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presupuestos_cliente_id ON public.presupuestos USING btree (cliente_id);


--
-- Name: idx_presupuestos_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presupuestos_estado ON public.presupuestos USING btree (estado);


--
-- Name: idx_presupuestos_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presupuestos_numero ON public.presupuestos USING btree (numero);


--
-- Name: idx_presupuestos_proyecto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presupuestos_proyecto_id ON public.presupuestos USING btree (proyecto_id);


--
-- Name: idx_presupuestos_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presupuestos_token ON public.presupuestos USING btree (token);


--
-- Name: idx_presupuestos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presupuestos_usuario_id ON public.presupuestos USING btree (usuario_id);


--
-- Name: idx_profiles_subscription_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_subscription_status ON public.profiles USING btree (subscription_status);


--
-- Name: idx_profiles_subscription_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_subscription_tier ON public.profiles USING btree (subscription_tier);


--
-- Name: idx_tareas_cliente_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tareas_cliente_id ON public.tareas USING btree (cliente_id);


--
-- Name: idx_tareas_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tareas_estado ON public.tareas USING btree (estado);


--
-- Name: idx_tareas_fecha_vencimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tareas_fecha_vencimiento ON public.tareas USING btree (fecha_vencimiento);


--
-- Name: idx_tareas_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tareas_usuario_id ON public.tareas USING btree (usuario_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name);


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: presupuestos calculate_presupuesto_vencimiento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER calculate_presupuesto_vencimiento BEFORE INSERT OR UPDATE ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.calculate_fecha_vencimiento();


--
-- Name: facturas generate_factura_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_factura_number BEFORE INSERT ON public.facturas FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();


--
-- Name: presupuestos generate_presupuesto_number; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_presupuesto_number BEFORE INSERT ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.generate_quote_number();


--
-- Name: presupuestos on_budget_status_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_budget_status_update AFTER UPDATE OF estado ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.handle_budget_status_change();


--
-- Name: modulos_estimacion tr_sync_modulo_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_sync_modulo_status AFTER UPDATE OF estado ON public.modulos_estimacion FOR EACH ROW EXECUTE FUNCTION public.sync_modulo_to_task();


--
-- Name: tareas tr_sync_task_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_sync_task_status AFTER UPDATE OF estado ON public.tareas FOR EACH ROW EXECUTE FUNCTION public.sync_task_to_modulo();


--
-- Name: clientes update_clientes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contratos update_contratos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: facturas update_facturas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON public.facturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: oportunidades update_oportunidades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_oportunidades_updated_at BEFORE UPDATE ON public.oportunidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pagos update_pagos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: presupuestos update_presupuestos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_presupuestos_updated_at BEFORE UPDATE ON public.presupuestos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: promociones update_promociones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_promociones_updated_at BEFORE UPDATE ON public.promociones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tareas update_tareas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: ai_usage_logs ai_usage_logs_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_usage_logs
    ADD CONSTRAINT ai_usage_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cliente_etiquetas cliente_etiquetas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiquetas
    ADD CONSTRAINT cliente_etiquetas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: cliente_etiquetas cliente_etiquetas_etiqueta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cliente_etiquetas
    ADD CONSTRAINT cliente_etiquetas_etiqueta_id_fkey FOREIGN KEY (etiqueta_id) REFERENCES public.etiquetas(id) ON DELETE CASCADE;


--
-- Name: clientes clientes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: contratos contratos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: documentos documentos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: documentos documentos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: equipo_miembros equipo_miembros_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id) ON DELETE CASCADE;


--
-- Name: equipo_miembros equipo_miembros_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo_miembros
    ADD CONSTRAINT equipo_miembros_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);


--
-- Name: equipos equipos_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipos
    ADD CONSTRAINT equipos_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);


--
-- Name: estimaciones estimaciones_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimaciones
    ADD CONSTRAINT estimaciones_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON DELETE CASCADE;


--
-- Name: etiquetas etiquetas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.etiquetas
    ADD CONSTRAINT etiquetas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: facturas facturas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: facturas facturas_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id) ON DELETE SET NULL;


--
-- Name: facturas facturas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pagos fk_pagos_factura; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT fk_pagos_factura FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE SET NULL;


--
-- Name: items_factura items_factura_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items_factura
    ADD CONSTRAINT items_factura_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE CASCADE;


--
-- Name: items_presupuesto items_presupuesto_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items_presupuesto
    ADD CONSTRAINT items_presupuesto_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id) ON DELETE CASCADE;


--
-- Name: modulos_estimacion modulos_estimacion_estimacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modulos_estimacion
    ADD CONSTRAINT modulos_estimacion_estimacion_id_fkey FOREIGN KEY (estimacion_id) REFERENCES public.estimaciones(id) ON DELETE CASCADE;


--
-- Name: notas_cliente notas_cliente_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_cliente
    ADD CONSTRAINT notas_cliente_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: notas_cliente notas_cliente_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notas_cliente
    ADD CONSTRAINT notas_cliente_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: notificaciones notificaciones_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id) ON DELETE SET NULL;


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oportunidades oportunidades_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: oportunidades oportunidades_etapa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_etapa_id_fkey FOREIGN KEY (etapa_id) REFERENCES public.pipeline_etapas(id) ON DELETE CASCADE;


--
-- Name: oportunidades oportunidades_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oportunidades
    ADD CONSTRAINT oportunidades_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: pagos pagos_presupuesto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_presupuesto_id_fkey FOREIGN KEY (presupuesto_id) REFERENCES public.presupuestos(id) ON DELETE SET NULL;


--
-- Name: pagos pagos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pipeline_etapas pipeline_etapas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_etapas
    ADD CONSTRAINT pipeline_etapas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: presupuestos presupuestos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: presupuestos presupuestos_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id);


--
-- Name: presupuestos presupuestos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presupuestos
    ADD CONSTRAINT presupuestos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_equipo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_equipo_id_fkey FOREIGN KEY (equipo_id) REFERENCES public.equipos(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proyectos proyectos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: proyectos proyectos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proyectos
    ADD CONSTRAINT proyectos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id);


--
-- Name: tareas tareas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;


--
-- Name: tareas tareas_modulo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_modulo_id_fkey FOREIGN KEY (modulo_id) REFERENCES public.modulos_estimacion(id) ON DELETE SET NULL;


--
-- Name: tareas tareas_oportunidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_oportunidad_id_fkey FOREIGN KEY (oportunidad_id) REFERENCES public.oportunidades(id) ON DELETE SET NULL;


--
-- Name: tareas tareas_proyecto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_proyecto_id_fkey FOREIGN KEY (proyecto_id) REFERENCES public.proyectos(id) ON DELETE SET NULL;


--
-- Name: tareas tareas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tareas
    ADD CONSTRAINT tareas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: usuarios_permitidos usuarios_permitidos_invitado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios_permitidos
    ADD CONSTRAINT usuarios_permitidos_invitado_por_fkey FOREIGN KEY (invitado_por) REFERENCES auth.users(id);


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: presupuestos Anonymous can view presupuesto by token check; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anonymous can view presupuesto by token check" ON public.presupuestos FOR SELECT USING (true);


--
-- Name: posibles_clientes Permitir inserts públicos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Permitir inserts públicos" ON public.posibles_clientes FOR INSERT TO anon WITH CHECK (true);


--
-- Name: clientes Public can view clientes via presupuesto; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view clientes via presupuesto" ON public.clientes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.presupuestos
  WHERE (presupuestos.cliente_id = clientes.id))));


--
-- Name: presupuestos Public can view presupuesto by valid token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view presupuesto by valid token" ON public.presupuestos FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: profiles Public can view profiles via presupuesto; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view profiles via presupuesto" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.presupuestos
  WHERE (presupuestos.usuario_id = profiles.id))));


--
-- Name: user_roles Solo admins pueden actualizar roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden actualizar roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: usuarios_permitidos Solo admins pueden actualizar usuarios permitidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden actualizar usuarios permitidos" ON public.usuarios_permitidos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: usuarios_permitidos Solo admins pueden agregar usuarios permitidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden agregar usuarios permitidos" ON public.usuarios_permitidos FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Solo admins pueden asignar roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden asignar roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Solo admins pueden eliminar roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden eliminar roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: usuarios_permitidos Solo admins pueden eliminar usuarios permitidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden eliminar usuarios permitidos" ON public.usuarios_permitidos FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: promociones Solo admins pueden gestionar promociones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden gestionar promociones" ON public.promociones USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: usuarios_permitidos Solo admins pueden ver usuarios permitidos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Solo admins pueden ver usuarios permitidos" ON public.usuarios_permitidos FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ai_usage_logs System can insert AI logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert AI logs" ON public.ai_usage_logs FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: promociones Todos pueden ver promociones activas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos pueden ver promociones activas" ON public.promociones FOR SELECT USING (((activa = true) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: items_factura Users can create items for own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create items for own facturas" ON public.items_factura FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.facturas
  WHERE ((facturas.id = items_factura.factura_id) AND (facturas.usuario_id = auth.uid())))));


--
-- Name: items_presupuesto Users can create items for own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create items for own presupuestos" ON public.items_presupuesto FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.presupuestos
  WHERE ((presupuestos.id = items_presupuesto.presupuesto_id) AND (presupuestos.usuario_id = auth.uid())))));


--
-- Name: cliente_etiquetas Users can create own cliente_etiquetas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own cliente_etiquetas" ON public.cliente_etiquetas FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.clientes
  WHERE ((clientes.id = cliente_etiquetas.cliente_id) AND (clientes.usuario_id = auth.uid())))));


--
-- Name: clientes Users can create own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own clients" ON public.clientes FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: contratos Users can create own contratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own contratos" ON public.contratos FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: documentos Users can create own documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own documentos" ON public.documentos FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: etiquetas Users can create own etiquetas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own etiquetas" ON public.etiquetas FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: facturas Users can create own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own facturas" ON public.facturas FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: notas_cliente Users can create own notas_cliente; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own notas_cliente" ON public.notas_cliente FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: oportunidades Users can create own oportunidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own oportunidades" ON public.oportunidades FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: pagos Users can create own pagos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own pagos" ON public.pagos FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: pipeline_etapas Users can create own pipeline_etapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own pipeline_etapas" ON public.pipeline_etapas FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: presupuestos Users can create own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own presupuestos" ON public.presupuestos FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: tareas Users can create own tareas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own tareas" ON public.tareas FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: estimaciones Users can delete estimaciones of their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete estimaciones of their projects" ON public.estimaciones FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.proyectos p
  WHERE ((p.id = estimaciones.proyecto_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: items_factura Users can delete items of own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete items of own facturas" ON public.items_factura FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.facturas
  WHERE ((facturas.id = items_factura.factura_id) AND (facturas.usuario_id = auth.uid())))));


--
-- Name: items_presupuesto Users can delete items of own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete items of own presupuestos" ON public.items_presupuesto FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.presupuestos
  WHERE ((presupuestos.id = items_presupuesto.presupuesto_id) AND (presupuestos.usuario_id = auth.uid())))));


--
-- Name: modulos_estimacion Users can delete modules of their estimations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete modules of their estimations" ON public.modulos_estimacion FOR DELETE USING ((EXISTS ( SELECT 1
   FROM (public.estimaciones e
     JOIN public.proyectos p ON ((p.id = e.proyecto_id)))
  WHERE ((e.id = modulos_estimacion.estimacion_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: cliente_etiquetas Users can delete own cliente_etiquetas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own cliente_etiquetas" ON public.cliente_etiquetas FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.clientes
  WHERE ((clientes.id = cliente_etiquetas.cliente_id) AND (clientes.usuario_id = auth.uid())))));


--
-- Name: clientes Users can delete own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own clients" ON public.clientes FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: contratos Users can delete own contratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own contratos" ON public.contratos FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: documentos Users can delete own documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own documentos" ON public.documentos FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: etiquetas Users can delete own etiquetas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own etiquetas" ON public.etiquetas FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: facturas Users can delete own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own facturas" ON public.facturas FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: notas_cliente Users can delete own notas_cliente; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notas_cliente" ON public.notas_cliente FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: oportunidades Users can delete own oportunidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own oportunidades" ON public.oportunidades FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: pagos Users can delete own pagos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own pagos" ON public.pagos FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: pipeline_etapas Users can delete own pipeline_etapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own pipeline_etapas" ON public.pipeline_etapas FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: presupuestos Users can delete own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own presupuestos" ON public.presupuestos FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: tareas Users can delete own tareas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own tareas" ON public.tareas FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: proyectos Users can delete their own projets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own projets" ON public.proyectos FOR DELETE USING ((auth.uid() = usuario_id));


--
-- Name: estimaciones Users can insert estimaciones to their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert estimaciones to their projects" ON public.estimaciones FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.proyectos p
  WHERE ((p.id = estimaciones.proyecto_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: modulos_estimacion Users can insert modules to their estimations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert modules to their estimations" ON public.modulos_estimacion FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.estimaciones e
     JOIN public.proyectos p ON ((p.id = e.proyecto_id)))
  WHERE ((e.id = modulos_estimacion.estimacion_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: proyectos Users can insert their own projets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own projets" ON public.proyectos FOR INSERT WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: estimaciones Users can update estimaciones of their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update estimaciones of their projects" ON public.estimaciones FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.proyectos p
  WHERE ((p.id = estimaciones.proyecto_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: items_factura Users can update items of own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update items of own facturas" ON public.items_factura FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.facturas
  WHERE ((facturas.id = items_factura.factura_id) AND (facturas.usuario_id = auth.uid())))));


--
-- Name: items_presupuesto Users can update items of own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update items of own presupuestos" ON public.items_presupuesto FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.presupuestos
  WHERE ((presupuestos.id = items_presupuesto.presupuesto_id) AND (presupuestos.usuario_id = auth.uid())))));


--
-- Name: modulos_estimacion Users can update modules of their estimations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update modules of their estimations" ON public.modulos_estimacion FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (public.estimaciones e
     JOIN public.proyectos p ON ((p.id = e.proyecto_id)))
  WHERE ((e.id = modulos_estimacion.estimacion_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: clientes Users can update own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own clients" ON public.clientes FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: contratos Users can update own contratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own contratos" ON public.contratos FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: etiquetas Users can update own etiquetas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own etiquetas" ON public.etiquetas FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: facturas Users can update own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own facturas" ON public.facturas FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: notificaciones Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notificaciones FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: oportunidades Users can update own oportunidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own oportunidades" ON public.oportunidades FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: pagos Users can update own pagos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own pagos" ON public.pagos FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: pipeline_etapas Users can update own pipeline_etapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own pipeline_etapas" ON public.pipeline_etapas FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: presupuestos Users can update own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own presupuestos" ON public.presupuestos FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: tareas Users can update own tareas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own tareas" ON public.tareas FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: proyectos Users can update their own projets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own projets" ON public.proyectos FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: estimaciones Users can view estimaciones of their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view estimaciones of their projects" ON public.estimaciones FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.proyectos p
  WHERE ((p.id = estimaciones.proyecto_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: items_presupuesto Users can view items of accessible presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view items of accessible presupuestos" ON public.items_presupuesto FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.presupuestos
  WHERE ((presupuestos.id = items_presupuesto.presupuesto_id) AND ((presupuestos.usuario_id = auth.uid()) OR (auth.uid() IS NULL))))));


--
-- Name: items_factura Users can view items of own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view items of own facturas" ON public.items_factura FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.facturas
  WHERE ((facturas.id = items_factura.factura_id) AND (facturas.usuario_id = auth.uid())))));


--
-- Name: items_presupuesto Users can view items of own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view items of own presupuestos" ON public.items_presupuesto FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.presupuestos
  WHERE ((presupuestos.id = items_presupuesto.presupuesto_id) AND (presupuestos.usuario_id = auth.uid())))));


--
-- Name: modulos_estimacion Users can view modules of their estimations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view modules of their estimations" ON public.modulos_estimacion FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.estimaciones e
     JOIN public.proyectos p ON ((p.id = e.proyecto_id)))
  WHERE ((e.id = modulos_estimacion.estimacion_id) AND (p.usuario_id = auth.uid())))));


--
-- Name: ai_usage_logs Users can view own AI logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own AI logs" ON public.ai_usage_logs FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: cliente_etiquetas Users can view own cliente_etiquetas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own cliente_etiquetas" ON public.cliente_etiquetas FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.clientes
  WHERE ((clientes.id = cliente_etiquetas.cliente_id) AND (clientes.usuario_id = auth.uid())))));


--
-- Name: clientes Users can view own clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own clients" ON public.clientes FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: contratos Users can view own contratos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own contratos" ON public.contratos FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: documentos Users can view own documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own documentos" ON public.documentos FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: etiquetas Users can view own etiquetas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own etiquetas" ON public.etiquetas FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: facturas Users can view own facturas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own facturas" ON public.facturas FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: notas_cliente Users can view own notas_cliente; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notas_cliente" ON public.notas_cliente FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: notificaciones Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notificaciones FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: oportunidades Users can view own oportunidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own oportunidades" ON public.oportunidades FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: pagos Users can view own pagos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own pagos" ON public.pagos FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: pipeline_etapas Users can view own pipeline_etapas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own pipeline_etapas" ON public.pipeline_etapas FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: presupuestos Users can view own presupuestos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own presupuestos" ON public.presupuestos FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: tareas Users can view own tareas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own tareas" ON public.tareas FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: proyectos Users can view their own projets; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own projets" ON public.proyectos FOR SELECT USING ((auth.uid() = usuario_id));


--
-- Name: user_roles Usuarios pueden ver su propio rol; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuarios pueden ver su propio rol" ON public.user_roles FOR SELECT USING (((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: ai_usage_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: cliente_etiquetas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cliente_etiquetas ENABLE ROW LEVEL SECURITY;

--
-- Name: clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: contratos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

--
-- Name: estimaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.estimaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: etiquetas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;

--
-- Name: facturas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

--
-- Name: items_factura; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.items_factura ENABLE ROW LEVEL SECURITY;

--
-- Name: items_presupuesto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.items_presupuesto ENABLE ROW LEVEL SECURITY;

--
-- Name: modulos_estimacion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modulos_estimacion ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_nexabis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_nexabis ENABLE ROW LEVEL SECURITY;

--
-- Name: notas_cliente; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notas_cliente ENABLE ROW LEVEL SECURITY;

--
-- Name: notificaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: oportunidades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

--
-- Name: pagos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

--
-- Name: pipeline_etapas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pipeline_etapas ENABLE ROW LEVEL SECURITY;

--
-- Name: posibles_clientes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posibles_clientes ENABLE ROW LEVEL SECURITY;

--
-- Name: presupuestos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.presupuestos ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: promociones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promociones ENABLE ROW LEVEL SECURITY;

--
-- Name: proyectos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;

--
-- Name: tareas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: usuarios_permitidos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.usuarios_permitidos ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Authenticated users can upload documentos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can upload documentos" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'documentos'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Authenticated users can upload logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'logos'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Public can view logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Public can view logos" ON storage.objects FOR SELECT USING ((bucket_id = 'logos'::text));


--
-- Name: objects Users can delete own documentos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own documentos" ON storage.objects FOR DELETE USING (((bucket_id = 'documentos'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Users can delete own logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE USING (((bucket_id = 'logos'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Users can update own logos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can update own logos" ON storage.objects FOR UPDATE USING (((bucket_id = 'logos'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: objects Users can view own documentos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can view own documentos" ON storage.objects FOR SELECT USING (((bucket_id = 'documentos'::text) AND (auth.uid() IS NOT NULL)));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict ZhH7Z1AjiCXY0Ve3IyRXAIbWctg5yncdUTweItJ4CTJadLNoNToeVOvYdCjYOzg

