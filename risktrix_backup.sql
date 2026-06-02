--
-- PostgreSQL database dump
--

\restrict 6clOaYs8a9pj6awBZj6opiYP5bBuGw8qZLxNaEnzCyXlaelhM8cx4OLeBrTYHya

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: applicationtype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.applicationtype AS ENUM (
    'WEB_APPLICATION',
    'MOBILE_APPLICATION',
    'DESKTOP_APPLICATION',
    'API_SERVICE',
    'DATABASE',
    'INFRASTRUCTURE',
    'THIRD_PARTY'
);


--
-- Name: risklevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.risklevel AS ENUM (
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW',
    'INFO'
);


--
-- Name: vulnerabilitystatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vulnerabilitystatus AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'CLOSED',
    'FALSE_POSITIVE',
    'ACCEPTED_RISK'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agent_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_availability (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    timezone character varying(50),
    weekly_schedule text,
    is_on_leave boolean,
    leave_until timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: agent_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_availability_id_seq OWNED BY public.agent_availability.id;


--
-- Name: agent_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_metrics (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    ticket_id integer,
    ticket_number character varying(50),
    resolution_time_minutes integer,
    quality_score double precision,
    sla_met boolean,
    category character varying(100),
    priority character varying(20),
    recorded_at timestamp without time zone
);


--
-- Name: agent_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_metrics_id_seq OWNED BY public.agent_metrics.id;


--
-- Name: agent_oncall; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_oncall (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    schedule_type character varying(20),
    notes character varying(255),
    created_at timestamp without time zone
);


--
-- Name: agent_oncall_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_oncall_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_oncall_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_oncall_id_seq OWNED BY public.agent_oncall.id;


--
-- Name: applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.applications (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    application_type public.applicationtype NOT NULL,
    version character varying(50),
    url character varying(500),
    risk_level public.risklevel NOT NULL,
    business_criticality character varying(50),
    data_classification character varying(50),
    owner character varying(255),
    vendor_name character varying(255),
    owner_id integer,
    organization_id integer,
    technology_stack json,
    environment character varying(50),
    hosting_type character varying(50),
    compliance_requirements json,
    last_security_review date,
    next_security_review date,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- Name: asset_changelog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_changelog (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    changed_by character varying DEFAULT 'system'::character varying,
    field_name character varying NOT NULL,
    old_value text,
    new_value text,
    changed_at timestamp without time zone DEFAULT now()
);


--
-- Name: asset_changelog_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asset_changelog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asset_changelog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asset_changelog_id_seq OWNED BY public.asset_changelog.id;


--
-- Name: asset_software; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_software (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    name character varying NOT NULL,
    vendor character varying,
    version character varying,
    patch_level character varying,
    is_outdated boolean DEFAULT false,
    is_licensed boolean DEFAULT true,
    license_expiry date,
    install_date date,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: asset_software_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asset_software_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asset_software_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asset_software_id_seq OWNED BY public.asset_software.id;


--
-- Name: asset_vulnerabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asset_vulnerabilities (
    id integer NOT NULL,
    asset_id integer NOT NULL,
    cve_id character varying,
    title character varying NOT NULL,
    severity character varying DEFAULT 'medium'::character varying,
    cvss_score double precision,
    description text,
    status character varying DEFAULT 'open'::character varying,
    discovered_at timestamp without time zone DEFAULT now(),
    resolved_at timestamp without time zone,
    remediation_notes text
);


--
-- Name: asset_vulnerabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asset_vulnerabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asset_vulnerabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asset_vulnerabilities_id_seq OWNED BY public.asset_vulnerabilities.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    name character varying NOT NULL,
    type character varying,
    risk_level character varying,
    vulnerabilities_count integer,
    created_at timestamp without time zone,
    serial_number character varying,
    device_model character varying,
    rack_position character varying,
    power_source character varying,
    power_watts character varying,
    location character varying,
    site character varying,
    notes character varying,
    vendor character varying,
    owner character varying,
    custodian character varying,
    ip_address character varying,
    hostname character varying,
    purchase_date date,
    warranty_expiry date,
    end_of_life_date date,
    business_criticality character varying,
    tags character varying,
    compliance_scope character varying
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: assignment_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_logs (
    id integer NOT NULL,
    ticket_number character varying NOT NULL,
    priority character varying NOT NULL,
    category character varying NOT NULL,
    assigned_to character varying,
    team character varying,
    auto_assigned boolean DEFAULT true,
    assigned_at timestamp without time zone DEFAULT now()
);


--
-- Name: assignment_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assignment_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assignment_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assignment_logs_id_seq OWNED BY public.assignment_logs.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    admin character varying NOT NULL,
    action character varying NOT NULL,
    target_type character varying NOT NULL,
    target_id integer,
    details text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: automation_executions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_executions (
    id integer NOT NULL,
    rule_id integer NOT NULL,
    rule_name character varying NOT NULL,
    trigger_type character varying NOT NULL,
    device_id integer,
    actions_taken json,
    status character varying,
    detail text,
    executed_at timestamp without time zone
);


--
-- Name: automation_executions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.automation_executions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: automation_executions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.automation_executions_id_seq OWNED BY public.automation_executions.id;


--
-- Name: automation_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automation_rules (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    trigger_type character varying NOT NULL,
    conditions_json json,
    actions_json json,
    enabled boolean,
    created_by character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: automation_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.automation_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: automation_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.automation_rules_id_seq OWNED BY public.automation_rules.id;


--
-- Name: compliance_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_results (
    id integer NOT NULL,
    device_id integer NOT NULL,
    policy_id integer NOT NULL,
    assignment_id integer NOT NULL,
    compliance_type character varying NOT NULL,
    status character varying,
    severity character varying,
    weight integer,
    detail text,
    remediation_required boolean,
    checked_at timestamp without time zone
);


--
-- Name: compliance_results_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_results_id_seq OWNED BY public.compliance_results.id;


--
-- Name: compliance_violations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_violations (
    id integer NOT NULL,
    device_id integer NOT NULL,
    policy_assignment_id integer NOT NULL,
    violation_type character varying NOT NULL,
    severity character varying DEFAULT 'medium'::character varying,
    description text DEFAULT ''::text,
    detected_at timestamp without time zone DEFAULT now(),
    resolved boolean DEFAULT false,
    resolved_at timestamp without time zone
);


--
-- Name: compliance_violations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.compliance_violations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: compliance_violations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.compliance_violations_id_seq OWNED BY public.compliance_violations.id;


--
-- Name: device_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_activities (
    id integer NOT NULL,
    device_id integer NOT NULL,
    event_type character varying NOT NULL,
    message text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: device_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_activities_id_seq OWNED BY public.device_activities.id;


--
-- Name: device_checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_checkins (
    id integer NOT NULL,
    device_id integer NOT NULL,
    battery integer,
    network character varying DEFAULT ''::character varying,
    ip_address character varying DEFAULT ''::character varying,
    checked_in_at timestamp without time zone DEFAULT now()
);


--
-- Name: device_checkins_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_checkins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_checkins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_checkins_id_seq OWNED BY public.device_checkins.id;


--
-- Name: device_commands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_commands (
    id integer NOT NULL,
    device_id integer NOT NULL,
    command_type character varying NOT NULL,
    status character varying,
    payload json,
    issued_by character varying,
    created_at timestamp without time zone,
    executed_at timestamp without time zone,
    response text
);


--
-- Name: device_commands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_commands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_commands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_commands_id_seq OWNED BY public.device_commands.id;


--
-- Name: device_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_enrollments (
    id integer NOT NULL,
    device_id integer NOT NULL,
    token_id integer NOT NULL,
    enrolled_at timestamp without time zone DEFAULT now(),
    enrolled_by character varying DEFAULT ''::character varying,
    enrollment_method character varying DEFAULT 'token'::character varying,
    status character varying DEFAULT 'active'::character varying
);


--
-- Name: device_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_enrollments_id_seq OWNED BY public.device_enrollments.id;


--
-- Name: device_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    device_id integer NOT NULL,
    added_at timestamp without time zone
);


--
-- Name: device_group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_group_members_id_seq OWNED BY public.device_group_members.id;


--
-- Name: device_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_groups (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    group_type character varying,
    smart_rule text,
    created_by character varying,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: device_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_groups_id_seq OWNED BY public.device_groups.id;


--
-- Name: device_security_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_security_profiles (
    id integer NOT NULL,
    device_id integer NOT NULL,
    is_rooted boolean,
    encryption_enabled boolean,
    screen_lock_enabled boolean,
    os_outdated boolean,
    blacklisted_app_detected boolean,
    risk_score integer,
    risk_level character varying,
    last_evaluated_at timestamp without time zone,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: device_security_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.device_security_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: device_security_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.device_security_profiles_id_seq OWNED BY public.device_security_profiles.id;


--
-- Name: devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devices (
    id integer NOT NULL,
    name character varying NOT NULL,
    platform character varying NOT NULL,
    os_version character varying DEFAULT ''::character varying,
    status character varying DEFAULT 'active'::character varying,
    owner character varying DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    device_uid character varying DEFAULT ''::character varying,
    serial_number character varying DEFAULT ''::character varying,
    device_model character varying DEFAULT ''::character varying,
    manufacturer character varying DEFAULT ''::character varying,
    mac_address character varying DEFAULT ''::character varying,
    department character varying DEFAULT ''::character varying,
    enrollment_status character varying DEFAULT 'unenrolled'::character varying,
    risk_level character varying DEFAULT 'low'::character varying,
    last_seen timestamp without time zone,
    battery_level integer,
    storage_used double precision,
    storage_total double precision,
    agent_version character varying,
    network_status character varying,
    ip_address character varying,
    online boolean DEFAULT false
);


--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.devices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: directory_agents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.directory_agents (
    id integer NOT NULL,
    email character varying NOT NULL,
    name character varying NOT NULL,
    team character varying NOT NULL,
    tier character varying,
    categories character varying,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


--
-- Name: directory_agents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.directory_agents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: directory_agents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.directory_agents_id_seq OWNED BY public.directory_agents.id;


--
-- Name: enrollment_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollment_tokens (
    id integer NOT NULL,
    token character varying NOT NULL,
    platform character varying NOT NULL,
    created_by character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    used_at timestamp without time zone,
    used_by_device_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: enrollment_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.enrollment_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enrollment_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enrollment_tokens_id_seq OWNED BY public.enrollment_tokens.id;


--
-- Name: eosl_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eosl_records (
    id integer NOT NULL,
    product_name character varying(255) NOT NULL,
    vendor_name character varying(255) NOT NULL,
    version character varying(100),
    category character varying(100),
    end_of_sale_date date,
    end_of_support_date date,
    end_of_extended_support_date date,
    risk_level public.risklevel NOT NULL,
    business_impact text,
    remediation_plan text,
    remediation_deadline date,
    application_id integer,
    owner_id integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: eosl_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eosl_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eosl_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eosl_records_id_seq OWNED BY public.eosl_records.id;


--
-- Name: group_policy_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_policy_assignments (
    id integer NOT NULL,
    group_id integer NOT NULL,
    policy_id integer NOT NULL,
    assigned_by character varying,
    assigned_at timestamp without time zone
);


--
-- Name: group_policy_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_policy_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_policy_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_policy_assignments_id_seq OWNED BY public.group_policy_assignments.id;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.organizations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.organizations_id_seq OWNED BY public.organizations.id;


--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.outbox_events (
    id integer NOT NULL,
    event_type character varying(100) NOT NULL,
    payload json NOT NULL,
    status character varying(20),
    retry_count integer,
    created_at timestamp without time zone,
    processed_at timestamp without time zone,
    error text
);


--
-- Name: outbox_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.outbox_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: outbox_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.outbox_events_id_seq OWNED BY public.outbox_events.id;


--
-- Name: policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policies (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    category character varying,
    platform character varying,
    require_screen_lock boolean,
    min_password_length integer,
    password_complexity boolean,
    password_expiry_days integer,
    bluetooth_disabled boolean,
    usb_disabled boolean,
    wifi_restricted boolean,
    os_update_required boolean,
    min_os_version character varying,
    encryption_required boolean,
    status character varying,
    created_at timestamp without time zone
);


--
-- Name: policies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.policies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: policies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.policies_id_seq OWNED BY public.policies.id;


--
-- Name: policy_device_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.policy_device_assignments (
    id integer NOT NULL,
    policy_id integer NOT NULL,
    device_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now(),
    deployment_status character varying DEFAULT 'pending'::character varying,
    assigned_by character varying DEFAULT 'admin'::character varying,
    deployment_message character varying DEFAULT ''::character varying,
    applied_at timestamp without time zone,
    last_checked_at timestamp without time zone,
    compliance_status character varying DEFAULT 'unknown'::character varying,
    compliance_score integer DEFAULT 0
);


--
-- Name: policy_device_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.policy_device_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: policy_device_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.policy_device_assignments_id_seq OWNED BY public.policy_device_assignments.id;


--
-- Name: remediation_actions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remediation_actions (
    id integer NOT NULL,
    device_id integer NOT NULL,
    alert_id integer,
    action_type character varying NOT NULL,
    performed_by character varying,
    notes text,
    status character varying,
    created_at timestamp without time zone,
    completed_at timestamp without time zone
);


--
-- Name: remediation_actions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.remediation_actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: remediation_actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.remediation_actions_id_seq OWNED BY public.remediation_actions.id;


--
-- Name: security_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_alerts (
    id integer NOT NULL,
    device_id integer NOT NULL,
    alert_type character varying NOT NULL,
    severity character varying NOT NULL,
    message text NOT NULL,
    status character varying,
    acknowledged_by character varying,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone
);


--
-- Name: security_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.security_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: security_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.security_alerts_id_seq OWNED BY public.security_alerts.id;


--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_comments (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    comment text NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone
);


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_comments_id_seq OWNED BY public.ticket_comments.id;


--
-- Name: ticket_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_history (
    id integer NOT NULL,
    ticket_id integer NOT NULL,
    ticket_number character varying NOT NULL,
    changed_by character varying NOT NULL,
    field_name character varying(100) NOT NULL,
    old_value text,
    new_value text,
    changed_at timestamp without time zone
);


--
-- Name: ticket_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ticket_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ticket_history_id_seq OWNED BY public.ticket_history.id;


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    ticket_number character varying NOT NULL,
    title character varying NOT NULL,
    description text,
    status character varying,
    priority character varying,
    impact character varying,
    urgency character varying,
    category character varying,
    assignment_group character varying,
    assigned_to character varying,
    created_by character varying NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    resolved_at timestamp without time zone,
    closed_at timestamp without time zone,
    resolution_code character varying,
    resolution_notes text,
    resolved_by character varying,
    caller character varying DEFAULT ''::character varying,
    channel character varying DEFAULT 'self-service'::character varying,
    subcategory character varying DEFAULT ''::character varying,
    sla_response_due timestamp without time zone,
    sla_resolution_due timestamp without time zone,
    sla_response_breached boolean DEFAULT false,
    sla_resolution_breached boolean DEFAULT false,
    sla_response_met_at timestamp without time zone,
    caller_email character varying DEFAULT ''::character varying,
    asset_id integer,
    parent_id integer
);


--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(100) NOT NULL,
    full_name character varying(255),
    hashed_password character varying(255) NOT NULL,
    is_active boolean NOT NULL,
    is_superuser boolean NOT NULL,
    role character varying(50),
    last_login timestamp with time zone,
    phone character varying(20),
    department character varying(100),
    profile_type character varying(100),
    company character varying(255),
    privilege_level character varying(50) NOT NULL,
    clearance_level character varying(50) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: vendors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vendors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vendors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vendors_id_seq OWNED BY public.vendors.id;


--
-- Name: vulnerabilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vulnerabilities (
    id integer NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    cve_id character varying(20),
    severity public.risklevel NOT NULL,
    status public.vulnerabilitystatus NOT NULL,
    discovered_date timestamp with time zone NOT NULL,
    source character varying(100),
    cvss_score numeric(3,1),
    cvss_vector character varying(200),
    exploit_available boolean NOT NULL,
    remediation_plan text,
    remediation_deadline date,
    remediation_completed timestamp with time zone,
    remarks text,
    impact text,
    poc_file_path character varying(500),
    application_id integer,
    vendor_id integer,
    assigned_to_id integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: vulnerabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vulnerabilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vulnerabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vulnerabilities_id_seq OWNED BY public.vulnerabilities.id;


--
-- Name: agent_availability id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_availability ALTER COLUMN id SET DEFAULT nextval('public.agent_availability_id_seq'::regclass);


--
-- Name: agent_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_metrics ALTER COLUMN id SET DEFAULT nextval('public.agent_metrics_id_seq'::regclass);


--
-- Name: agent_oncall id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_oncall ALTER COLUMN id SET DEFAULT nextval('public.agent_oncall_id_seq'::regclass);


--
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- Name: asset_changelog id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_changelog ALTER COLUMN id SET DEFAULT nextval('public.asset_changelog_id_seq'::regclass);


--
-- Name: asset_software id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_software ALTER COLUMN id SET DEFAULT nextval('public.asset_software_id_seq'::regclass);


--
-- Name: asset_vulnerabilities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_vulnerabilities ALTER COLUMN id SET DEFAULT nextval('public.asset_vulnerabilities_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: assignment_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_logs ALTER COLUMN id SET DEFAULT nextval('public.assignment_logs_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: automation_executions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_executions ALTER COLUMN id SET DEFAULT nextval('public.automation_executions_id_seq'::regclass);


--
-- Name: automation_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules ALTER COLUMN id SET DEFAULT nextval('public.automation_rules_id_seq'::regclass);


--
-- Name: compliance_results id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_results ALTER COLUMN id SET DEFAULT nextval('public.compliance_results_id_seq'::regclass);


--
-- Name: compliance_violations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_violations ALTER COLUMN id SET DEFAULT nextval('public.compliance_violations_id_seq'::regclass);


--
-- Name: device_activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_activities ALTER COLUMN id SET DEFAULT nextval('public.device_activities_id_seq'::regclass);


--
-- Name: device_checkins id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_checkins ALTER COLUMN id SET DEFAULT nextval('public.device_checkins_id_seq'::regclass);


--
-- Name: device_commands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_commands ALTER COLUMN id SET DEFAULT nextval('public.device_commands_id_seq'::regclass);


--
-- Name: device_enrollments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_enrollments ALTER COLUMN id SET DEFAULT nextval('public.device_enrollments_id_seq'::regclass);


--
-- Name: device_group_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_group_members ALTER COLUMN id SET DEFAULT nextval('public.device_group_members_id_seq'::regclass);


--
-- Name: device_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_groups ALTER COLUMN id SET DEFAULT nextval('public.device_groups_id_seq'::regclass);


--
-- Name: device_security_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_security_profiles ALTER COLUMN id SET DEFAULT nextval('public.device_security_profiles_id_seq'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: directory_agents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.directory_agents ALTER COLUMN id SET DEFAULT nextval('public.directory_agents_id_seq'::regclass);


--
-- Name: enrollment_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollment_tokens ALTER COLUMN id SET DEFAULT nextval('public.enrollment_tokens_id_seq'::regclass);


--
-- Name: eosl_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eosl_records ALTER COLUMN id SET DEFAULT nextval('public.eosl_records_id_seq'::regclass);


--
-- Name: group_policy_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_policy_assignments ALTER COLUMN id SET DEFAULT nextval('public.group_policy_assignments_id_seq'::regclass);


--
-- Name: organizations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations ALTER COLUMN id SET DEFAULT nextval('public.organizations_id_seq'::regclass);


--
-- Name: outbox_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbox_events ALTER COLUMN id SET DEFAULT nextval('public.outbox_events_id_seq'::regclass);


--
-- Name: policies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies ALTER COLUMN id SET DEFAULT nextval('public.policies_id_seq'::regclass);


--
-- Name: policy_device_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_device_assignments ALTER COLUMN id SET DEFAULT nextval('public.policy_device_assignments_id_seq'::regclass);


--
-- Name: remediation_actions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remediation_actions ALTER COLUMN id SET DEFAULT nextval('public.remediation_actions_id_seq'::regclass);


--
-- Name: security_alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_alerts ALTER COLUMN id SET DEFAULT nextval('public.security_alerts_id_seq'::regclass);


--
-- Name: ticket_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments ALTER COLUMN id SET DEFAULT nextval('public.ticket_comments_id_seq'::regclass);


--
-- Name: ticket_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_history ALTER COLUMN id SET DEFAULT nextval('public.ticket_history_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vendors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors ALTER COLUMN id SET DEFAULT nextval('public.vendors_id_seq'::regclass);


--
-- Name: vulnerabilities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vulnerabilities ALTER COLUMN id SET DEFAULT nextval('public.vulnerabilities_id_seq'::regclass);


--
-- Data for Name: agent_availability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_availability (id, agent_id, timezone, weekly_schedule, is_on_leave, leave_until, updated_at) FROM stdin;
1	1	UTC	\N	f	\N	2026-05-18 08:25:19.161911
2	2	UTC	\N	f	\N	2026-05-18 08:25:19.163777
3	4	UTC	\N	f	\N	2026-05-18 08:25:19.163777
4	3	UTC	\N	f	\N	2026-05-18 08:25:19.253578
5	5	UTC	\N	f	\N	2026-05-18 11:49:13.341938
\.


--
-- Data for Name: agent_metrics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_metrics (id, agent_id, ticket_id, ticket_number, resolution_time_minutes, quality_score, sla_met, category, priority, recorded_at) FROM stdin;
\.


--
-- Data for Name: agent_oncall; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_oncall (id, agent_id, start_time, end_time, schedule_type, notes, created_at) FROM stdin;
1	1	2026-05-28 13:55:00	2026-05-28 14:55:00	primary	\N	2026-05-18 08:26:06.075918
3	1	2026-05-18 14:26:00	2026-05-20 15:26:00	primary	\N	2026-05-18 08:57:05.959302
6	2	2026-05-18 15:29:00	2026-05-19 15:29:00	primary	\N	2026-05-18 09:59:19.190992
7	2	2026-05-18 15:29:00	2026-05-19 15:29:00	backup	\N	2026-05-18 09:59:55.508604
8	4	2026-05-18 15:36:00	2026-05-19 15:36:00	primary	\N	2026-05-18 10:06:33.693935
9	2	2026-05-18 15:51:00	2026-05-20 16:52:00	primary	\N	2026-05-18 10:21:25.293513
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.applications (id, name, description, application_type, version, url, risk_level, business_criticality, data_classification, owner, vendor_name, owner_id, organization_id, technology_stack, environment, hosting_type, compliance_requirements, last_security_review, next_security_review, created_at, updated_at) FROM stdin;
1	Test App	\N	WEB_APPLICATION	\N	\N	LOW	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-01 13:00:06.825808+05:30	2026-05-01 13:00:06.825808+05:30
\.


--
-- Data for Name: asset_changelog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_changelog (id, asset_id, changed_by, field_name, old_value, new_value, changed_at) FROM stdin;
\.


--
-- Data for Name: asset_software; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_software (id, asset_id, name, vendor, version, patch_level, is_outdated, is_licensed, license_expiry, install_date, created_at) FROM stdin;
\.


--
-- Data for Name: asset_vulnerabilities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asset_vulnerabilities (id, asset_id, cve_id, title, severity, cvss_score, description, status, discovered_at, resolved_at, remediation_notes) FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assets (id, name, type, risk_level, vulnerabilities_count, created_at, serial_number, device_model, rack_position, power_source, power_watts, location, site, notes, vendor, owner, custodian, ip_address, hostname, purchase_date, warranty_expiry, end_of_life_date, business_criticality, tags, compliance_scope) FROM stdin;
22	Test Asset2	web_application	low	0	2026-05-04 08:39:28.276833	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
23	Test Asset2	web_application	low	0	2026-05-04 08:41:07.399594	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
28	Test Asset2	web_application	low	0	2026-05-04 09:10:21.15005	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
29	Test Asset2	web_application	low	0	2026-05-04 09:29:58.884114	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
30	Test Asset2	web_application	medium	0	2026-05-04 09:33:06.992632	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
31	Test App	web_application	low	0	2026-05-04 09:34:27.612145	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
32	Test App	web_application	low	0	2026-05-04 09:34:29.692037	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	test-asset	web_application	medium	0	2026-05-04 05:45:21.110549	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	test-asset	web_application	medium	0	2026-05-04 05:45:27.53604	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	test-asset	web_application	medium	0	2026-05-04 06:27:25.963194	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	Test app	web_application	low	0	2026-05-04 06:41:08.293542	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
33	Test Asset2	web_application	high	0	2026-05-04 10:24:30.337866	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6	Test Asset22	api	high	0	2026-05-04 06:41:26.15295	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
34	DLINK-DGS-3120-24TC	switch	medium	0	2026-05-18 05:27:48.607286	PVT54E6000243	DLINK-DGS-3120-24TC	40 U	SINGLE	370W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
35	FORTIGATE 60F	router	medium	0	2026-05-18 05:27:48.617464	FGT60FTK23020936	FORTIGATE 60F	30 U	SINGLE	15W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
36	ENTRUST	network_device	medium	0	2026-05-18 05:27:48.624677	46-UC0385A	ENTRUST	11 U	DUAL	250W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
37	DELL POWEREDGE R630	server	medium	0	2026-05-18 05:27:48.624677	8F74N62	DELL POWEREDGE R630	6 U	DUAL	750W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
38	HP Proliant DL180Gen9	server	medium	0	2026-05-18 05:27:48.624677	SGH724SNCN	HP Proliant DL180Gen9	5 U	DUAL	550W	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
39	Dell Latitude 5420	network_device	high	0	2026-05-18 05:32:57.569244	DL5420-ABC123	Latitude 5420	\N	\N	\N	Noida Office	\N	Assigned to IT admin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
40	HP ProDesk 600	network_device	medium	0	2026-05-18 05:32:57.571179	HP600-XYZ789	ProDesk 600	\N	\N	\N	Delhi Office	\N	Finance department system	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: assignment_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_logs (id, ticket_number, priority, category, assigned_to, team, auto_assigned, assigned_at) FROM stdin;
1	TKT-00018	critical	network	eve@risktrix.com	it-ops	t	2026-05-16 06:22:18.160439
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, admin, action, target_type, target_id, details, created_at) FROM stdin;
1	admin	assign_policy	policy	4	Assigned policy #4 to 4 device(s)	2026-05-11 10:09:53.287837
2	admin	bulk_assign	policy	\N	Bulk assigned 1 polic(ies) to 1 device(s) — 0 created, 1 skipped	2026-05-11 10:34:55.823428
3	admin	bulk_assign	policy	\N	Bulk assigned 4 polic(ies) to 9 device(s) — 25 created, 11 skipped	2026-05-18 05:39:24.236696
4	admin	retry_deployment	assignment	6	Retried deployment for assignment #6	2026-05-18 11:46:12.553037
\.


--
-- Data for Name: automation_executions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.automation_executions (id, rule_id, rule_name, trigger_type, device_id, actions_taken, status, detail, executed_at) FROM stdin;
\.


--
-- Data for Name: automation_rules; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.automation_rules (id, name, description, trigger_type, conditions_json, actions_json, enabled, created_by, created_at, updated_at) FROM stdin;
1	xccc	zxasxx	agent_checkin	[{"field": "battery_level", "op": "gt", "value": ""}]	[{"type": "restart_device", "severity": "high", "alert_type": "automation_trigger", "message": "", "action_type": "note", "notes": ""}]	t	admin	2026-05-16 05:27:10.236714	2026-05-18 10:35:18.70508
\.


--
-- Data for Name: compliance_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance_results (id, device_id, policy_id, assignment_id, compliance_type, status, severity, weight, detail, remediation_required, checked_at) FROM stdin;
11110	3	2	3	screen_lock	fail	high	15	Screen lock is not configured	t	2026-05-18 13:23:10.536174
11111	3	2	3	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:10.536174
11112	3	2	3	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:10.536174
11113	3	2	3	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:10.536174
11114	3	2	3	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:10.536174
11115	3	2	3	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:10.536174
11116	3	2	3	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:10.536174
11117	3	2	3	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:10.536174
11125	1	4	10	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:10.689211
11126	1	4	10	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:10.689211
11127	1	4	10	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:10.689211
11128	1	4	10	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:10.689211
11129	1	4	10	password_complexity	fail	medium	10	Password does not meet complexity requirements	t	2026-05-18 13:23:10.689211
11130	1	4	10	bluetooth	fail	medium	10	Bluetooth is enabled — policy requires it to be disabled	f	2026-05-18 13:23:10.689211
11131	1	4	10	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:10.689211
11132	1	4	10	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:10.689211
11150	11	5	38	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:10.895871
11151	11	5	38	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:10.895871
11152	11	5	38	os_update	fail	high	15	OS version is below the required minimum	t	2026-05-18 13:23:10.895871
11153	11	5	38	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:10.895871
11154	11	5	38	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:10.895871
11155	11	5	38	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:10.895871
11156	11	5	38	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:10.895871
11157	11	5	38	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:10.895871
11158	11	5	38	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:10.895871
11173	5	3	23	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.125741
11174	5	3	23	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.125741
11175	5	3	23	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.125741
11176	5	3	23	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.125741
11177	5	3	23	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.125741
11178	5	3	23	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.125741
11179	5	3	23	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.125741
11198	1	5	33	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.355388
11199	1	5	33	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.355388
11200	1	5	33	os_update	fail	high	15	OS version is below the required minimum	t	2026-05-18 13:23:11.355388
11201	1	5	33	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.355388
11202	1	5	33	password_complexity	fail	medium	10	Password does not meet complexity requirements	t	2026-05-18 13:23:11.355388
11203	1	5	33	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:11.355388
11204	1	5	33	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.355388
11205	1	5	33	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.355388
11206	1	5	33	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.355388
11223	3	5	35	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.588445
11224	3	5	35	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.588445
11225	3	5	35	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.588445
11226	3	5	35	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.588445
11227	3	5	35	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.588445
11228	3	5	35	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:11.588445
11229	3	5	35	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.588445
11230	3	5	35	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.588445
11231	3	5	35	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.588445
11249	8	3	21	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.823422
11250	8	3	21	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.823422
11251	8	3	21	password_length	fail	medium	10	Password is shorter than the required minimum	t	2026-05-18 13:23:11.823422
11252	8	3	21	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.823422
11253	8	3	21	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.823422
11254	8	3	21	usb	fail	high	10	USB access is enabled — policy requires it to be blocked	t	2026-05-18 13:23:11.823422
11255	8	3	21	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.823422
11272	3	4	12	screen_lock	fail	high	15	Screen lock is not configured	t	2026-05-18 13:23:12.047512
11273	3	4	12	encryption	fail	critical	20	Device encryption is disabled — data at risk	t	2026-05-18 13:23:12.047512
11274	3	4	12	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:12.047512
11275	3	4	12	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:12.047512
11276	3	4	12	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.047512
11277	3	4	12	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.047512
11278	3	4	12	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.047512
11279	3	4	12	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.047512
11297	7	4	15	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:12.295565
11298	7	4	15	encryption	fail	critical	20	Device encryption is disabled — data at risk	t	2026-05-18 13:23:12.295565
11299	7	4	15	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:12.295565
11300	7	4	15	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:12.295565
11118	11	3	24	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:10.605761
11119	11	3	24	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:10.605761
11120	11	3	24	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:10.605761
11121	11	3	24	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:10.605761
11122	11	3	24	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:10.605761
11123	11	3	24	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:10.605761
11124	11	3	24	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:10.605761
11133	11	4	18	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:10.763552
11134	11	4	18	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:10.763552
11135	11	4	18	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:10.763552
11136	11	4	18	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:10.763552
11137	11	4	18	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:10.763552
11138	11	4	18	bluetooth	fail	medium	10	Bluetooth is enabled — policy requires it to be disabled	f	2026-05-18 13:23:10.763552
11139	11	4	18	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:10.763552
11140	11	4	18	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:10.763552
11159	1	3	6	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:10.982729
11160	1	3	6	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:10.982729
11161	1	3	6	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:10.982729
11162	1	3	6	password_complexity	fail	medium	10	Password does not meet complexity requirements	t	2026-05-18 13:23:10.982729
11163	1	3	6	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:10.982729
11164	1	3	6	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:10.982729
11165	1	3	6	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:10.982729
11180	8	5	32	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.201197
11181	8	5	32	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.201197
11182	8	5	32	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.201197
11183	8	5	32	password_length	fail	medium	10	Password is shorter than the required minimum	t	2026-05-18 13:23:11.201197
11184	8	5	32	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.201197
11185	8	5	32	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:11.201197
11186	8	5	32	bluetooth	fail	medium	10	Bluetooth is enabled — policy requires it to be disabled	f	2026-05-18 13:23:11.201197
11187	8	5	32	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.201197
11188	8	5	32	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.201197
11207	2	2	2	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.427036
11208	2	2	2	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.427036
11209	2	2	2	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.427036
11210	2	2	2	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.427036
11211	2	2	2	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.427036
11212	2	2	2	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.427036
11213	2	2	2	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.427036
11214	2	2	2	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.427036
11232	4	2	28	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.669845
11233	4	2	28	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.669845
11234	4	2	28	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.669845
11235	4	2	28	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.669845
11236	4	2	28	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.669845
11237	4	2	28	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.669845
11238	4	2	28	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.669845
11239	4	2	28	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.669845
11256	7	2	26	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.8956
11257	7	2	26	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.8956
11258	7	2	26	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.8956
11259	7	2	26	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.8956
11260	7	2	26	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.8956
11261	7	2	26	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.8956
11262	7	2	26	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.8956
11263	7	2	26	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.8956
11280	6	5	30	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:12.136731
11281	6	5	30	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:12.136731
11282	6	5	30	os_update	fail	high	15	OS version is below the required minimum	t	2026-05-18 13:23:12.136731
11283	6	5	30	password_length	fail	medium	10	Password is shorter than the required minimum	t	2026-05-18 13:23:12.136731
11284	6	5	30	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.136731
11285	6	5	30	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:12.136731
11286	6	5	30	bluetooth	fail	medium	10	Bluetooth is enabled — policy requires it to be disabled	f	2026-05-18 13:23:12.136731
11287	6	5	30	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.136731
11288	6	5	30	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.136731
11305	8	2	27	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:12.371912
11306	8	2	27	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:12.371912
11307	8	2	27	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:12.371912
11308	8	2	27	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:12.371912
11309	8	2	27	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.371912
11310	8	2	27	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.371912
11141	2	5	34	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:10.827575
11142	2	5	34	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:10.827575
11143	2	5	34	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:10.827575
11144	2	5	34	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:10.827575
11145	2	5	34	password_complexity	fail	medium	10	Password does not meet complexity requirements	t	2026-05-18 13:23:10.827575
11146	2	5	34	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:10.827575
11147	2	5	34	bluetooth	fail	medium	10	Bluetooth is enabled — policy requires it to be disabled	f	2026-05-18 13:23:10.827575
11148	2	5	34	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:10.827575
11149	2	5	34	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:10.827575
11166	4	3	22	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.046672
11167	4	3	22	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.046672
11168	4	3	22	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.046672
11169	4	3	22	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.046672
11170	4	3	22	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.046672
11171	4	3	22	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.046672
11172	4	3	22	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.046672
11189	5	5	37	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.280724
11190	5	5	37	encryption	fail	critical	20	Device encryption is disabled — data at risk	t	2026-05-18 13:23:11.280724
11191	5	5	37	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.280724
11192	5	5	37	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.280724
11193	5	5	37	password_complexity	fail	medium	10	Password does not meet complexity requirements	t	2026-05-18 13:23:11.280724
11194	5	5	37	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:11.280724
11195	5	5	37	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.280724
11196	5	5	37	usb	fail	high	10	USB access is enabled — policy requires it to be blocked	t	2026-05-18 13:23:11.280724
11197	5	5	37	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.280724
11215	6	4	14	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.505639
11216	6	4	14	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.505639
11217	6	4	14	os_update	fail	high	15	OS version is below the required minimum	t	2026-05-18 13:23:11.505639
11218	6	4	14	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.505639
11219	6	4	14	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.505639
11220	6	4	14	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.505639
11221	6	4	14	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.505639
11222	6	4	14	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.505639
11240	4	5	36	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.747641
11241	4	5	36	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.747641
11242	4	5	36	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:11.747641
11243	4	5	36	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.747641
11244	4	5	36	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.747641
11245	4	5	36	password_expiry	pass	low	5	Password expiry policy is compliant	f	2026-05-18 13:23:11.747641
11246	4	5	36	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.747641
11247	4	5	36	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.747641
11248	4	5	36	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:11.747641
11264	1	2	1	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:11.968587
11265	1	2	1	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:11.968587
11266	1	2	1	os_update	fail	high	15	OS version is below the required minimum	t	2026-05-18 13:23:11.968587
11267	1	2	1	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:11.968587
11268	1	2	1	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:11.968587
11269	1	2	1	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:11.968587
11270	1	2	1	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:11.968587
11271	1	2	1	wifi	fail	medium	5	Unrestricted Wi-Fi access detected	f	2026-05-18 13:23:11.968587
11289	4	4	13	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:12.216129
11290	4	4	13	encryption	fail	critical	20	Device encryption is disabled — data at risk	t	2026-05-18 13:23:12.216129
11291	4	4	13	os_update	fail	high	15	OS version is below the required minimum	t	2026-05-18 13:23:12.216129
11292	4	4	13	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:12.216129
11293	4	4	13	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.216129
11294	4	4	13	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.216129
11295	4	4	13	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.216129
11296	4	4	13	wifi	fail	medium	5	Unrestricted Wi-Fi access detected	f	2026-05-18 13:23:12.216129
11313	6	2	25	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:12.451277
11314	6	2	25	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:12.451277
11315	6	2	25	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:12.451277
11316	6	2	25	password_length	fail	medium	10	Password is shorter than the required minimum	t	2026-05-18 13:23:12.451277
11317	6	2	25	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.451277
11318	6	2	25	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.451277
11319	6	2	25	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.451277
11320	6	2	25	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.451277
11336	7	3	20	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:12.657761
11337	7	3	20	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:12.657761
11338	7	3	20	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:12.657761
11301	7	4	15	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.295565
11302	7	4	15	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.295565
11303	7	4	15	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.295565
11304	7	4	15	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.295565
11321	6	3	19	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:12.52318
11322	6	3	19	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:12.52318
11323	6	3	19	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:12.52318
11324	6	3	19	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.52318
11325	6	3	19	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.52318
11326	6	3	19	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.52318
11327	6	3	19	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.52318
11339	7	3	20	password_complexity	pass	medium	10	Password complexity requirements met	f	2026-05-18 13:23:12.657761
11340	7	3	20	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.657761
11341	7	3	20	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.657761
11342	7	3	20	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.657761
11311	8	2	27	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.371912
11312	8	2	27	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.371912
11328	2	4	11	screen_lock	pass	high	15	Screen lock is enabled	f	2026-05-18 13:23:12.593896
11329	2	4	11	encryption	pass	critical	20	Device encryption is enabled	f	2026-05-18 13:23:12.593896
11330	2	4	11	os_update	pass	high	15	OS is up to date	f	2026-05-18 13:23:12.593896
11331	2	4	11	password_length	pass	medium	10	Password meets length requirement	f	2026-05-18 13:23:12.593896
11332	2	4	11	password_complexity	fail	medium	10	Password does not meet complexity requirements	t	2026-05-18 13:23:12.593896
11333	2	4	11	bluetooth	pass	medium	10	Bluetooth is disabled as required	f	2026-05-18 13:23:12.593896
11334	2	4	11	usb	pass	high	10	USB access is blocked as required	f	2026-05-18 13:23:12.593896
11335	2	4	11	wifi	pass	medium	5	Wi-Fi access is within policy	f	2026-05-18 13:23:12.593896
\.


--
-- Data for Name: compliance_violations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.compliance_violations (id, device_id, policy_assignment_id, violation_type, severity, description, detected_at, resolved, resolved_at) FROM stdin;
1	1	10	encryption_disabled	critical	Device storage encryption is not enabled	2026-05-11 10:09:53.208837	f	\N
2	1	10	os_not_updated	high	Device OS version is below the required minimum	2026-05-11 10:09:53.208837	f	\N
3	1	10	usb_enabled	medium	USB access is enabled but policy requires it disabled	2026-05-11 10:09:53.208837	f	\N
4	2	11	encryption_disabled	critical	Device storage encryption is not enabled	2026-05-11 10:09:53.234793	f	\N
5	2	11	screen_lock_missing	high	Screen lock / PIN is not configured on the device	2026-05-11 10:09:53.234793	f	\N
6	2	11	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-11 10:09:53.234793	f	\N
7	3	12	screen_lock_missing	high	Screen lock / PIN is not configured on the device	2026-05-11 10:09:53.257296	f	\N
8	3	12	os_not_updated	high	Device OS version is below the required minimum	2026-05-11 10:09:53.257296	f	\N
9	4	13	screen_lock_missing	high	Screen lock / PIN is not configured on the device	2026-05-11 10:09:53.278345	f	\N
10	4	13	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-11 10:09:53.278345	f	\N
11	4	13	usb_enabled	medium	USB access is enabled but policy requires it disabled	2026-05-11 10:09:53.278345	f	\N
12	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-11 11:53:20.589752	t	2026-05-11 12:04:17.713361
13	2	2	screen_lock	high	Screen lock is not configured	2026-05-11 11:53:20.645815	t	2026-05-11 12:04:17.764611
14	3	3	os_update	high	OS version is below the required minimum	2026-05-11 11:53:20.678506	t	2026-05-11 12:04:17.796447
15	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-11 11:53:20.7073	t	2026-05-11 12:04:17.829726
17	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-11 11:53:20.738214	t	2026-05-11 12:04:17.87355
18	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-11 11:53:20.772583	t	2026-05-11 12:04:17.897851
19	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-11 11:53:20.805924	t	2026-05-11 12:04:17.929623
20	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-11 12:04:17.796447	t	2026-05-11 12:04:24.329598
16	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-11 11:53:20.7073	t	2026-05-11 12:04:24.368572
21	2	11	os_update	high	OS version is below the required minimum	2026-05-11 12:04:17.87355	t	2026-05-11 12:04:24.403718
22	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-11 12:04:17.87355	t	2026-05-11 12:04:24.403718
23	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-11 12:04:17.929623	t	2026-05-11 12:04:24.478358
24	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-11 12:04:24.279977	t	2026-05-11 12:06:43.007754
25	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-11 12:04:24.279977	t	2026-05-11 12:06:43.007754
27	1	10	os_update	high	OS version is below the required minimum	2026-05-11 12:04:24.368572	t	2026-05-11 12:06:43.133377
28	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-11 12:04:24.403718	t	2026-05-11 12:06:43.177865
26	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-11 12:04:24.329598	t	2026-05-12 05:59:00.546063
30	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-11 12:06:43.133377	t	2026-05-12 05:59:00.5771
31	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-11 12:06:43.177865	t	2026-05-12 05:59:00.602109
32	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-11 12:06:43.21041	t	2026-05-12 05:59:00.625029
33	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-11 12:06:43.21041	t	2026-05-12 05:59:00.625029
34	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-11 12:06:43.238676	t	2026-05-12 05:59:00.639886
35	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-11 12:06:43.238676	t	2026-05-12 05:59:00.639886
37	2	11	encryption	critical	Device encryption is disabled — data at risk	2026-05-12 05:59:00.602109	t	2026-05-12 06:29:00.511941
38	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 05:59:00.625029	t	2026-05-12 06:29:00.527033
39	4	13	os_update	high	OS version is below the required minimum	2026-05-12 05:59:00.639886	t	2026-05-12 06:29:00.558602
40	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-12 05:59:00.639886	t	2026-05-12 06:29:00.558602
29	1	1	os_update	high	OS version is below the required minimum	2026-05-11 12:06:42.856547	t	2026-05-12 06:44:00.395717
41	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 06:29:00.448852	t	2026-05-12 06:44:00.449987
42	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 06:29:00.448852	t	2026-05-12 06:44:00.449987
36	1	10	os_update	high	OS version is below the required minimum	2026-05-12 05:59:00.5771	t	2026-05-12 06:44:00.481007
43	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 06:29:00.47924	t	2026-05-12 06:44:00.481007
45	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 06:29:00.527033	t	2026-05-12 06:44:00.528558
46	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 06:29:00.527033	t	2026-05-12 06:44:00.528558
47	1	1	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-12 06:44:00.395717	t	2026-05-12 07:03:18.890712
48	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 06:44:00.430147	t	2026-05-12 07:03:19.001687
44	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 06:29:00.511941	t	2026-05-12 07:03:19.192344
49	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 06:44:00.481007	t	2026-05-12 07:18:19.111856
51	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 07:03:19.192344	t	2026-05-12 07:18:19.1734
52	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 07:03:19.192344	t	2026-05-12 07:18:19.1734
53	3	12	os_update	high	OS version is below the required minimum	2026-05-12 07:03:19.24738	t	2026-05-12 07:18:19.220752
50	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 06:44:00.528558	t	2026-05-12 07:18:19.220752
54	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 07:03:19.309459	t	2026-05-12 07:18:19.257475
55	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-12 07:18:18.83873	t	2026-05-12 09:49:12.599019
56	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-12 07:18:18.955923	t	2026-05-12 09:49:12.644013
57	3	3	os_update	high	OS version is below the required minimum	2026-05-12 07:18:19.064933	t	2026-05-12 09:49:12.671349
59	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 09:49:12.599019	t	2026-05-12 10:04:12.593762
58	1	10	os_update	high	OS version is below the required minimum	2026-05-12 07:18:19.111856	t	2026-05-12 10:04:12.724129
60	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 09:49:12.599019	t	2026-05-12 10:04:12.593762
61	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-12 09:49:12.692694	t	2026-05-12 10:04:12.724129
62	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-12 09:49:12.742745	t	2026-05-12 10:04:12.810533
63	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 09:49:12.742745	t	2026-05-12 10:04:12.810533
64	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 09:49:12.762252	t	2026-05-12 10:04:12.847154
71	2	11	screen_lock	high	Screen lock is not configured	2026-05-12 10:04:12.76148	t	2026-05-12 10:43:57.004449
72	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 10:04:12.76148	t	2026-05-12 10:43:57.004449
73	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 10:43:57.004449	t	2026-05-12 10:57:21.266558
65	2	2	os_update	high	OS version is below the required minimum	2026-05-12 10:04:12.643999	t	2026-05-12 10:57:21.522284
66	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-12 10:04:12.643999	t	2026-05-12 10:57:21.522284
67	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 10:04:12.643999	t	2026-05-12 10:57:21.522284
69	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 10:04:12.679532	t	2026-05-12 10:57:21.590154
70	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 10:04:12.679532	t	2026-05-12 10:57:21.590154
74	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-12 10:57:21.266558	t	2026-05-12 11:26:30.31134
75	3	12	os_update	high	OS version is below the required minimum	2026-05-12 10:57:21.368627	t	2026-05-12 11:26:30.369139
76	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 10:57:21.368627	t	2026-05-12 11:26:30.369139
77	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-12 10:57:21.454268	t	2026-05-12 11:26:30.419615
78	1	1	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-12 10:57:21.454268	t	2026-05-12 11:26:30.419615
79	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 10:57:21.522284	t	2026-05-12 11:26:30.480334
68	3	3	os_update	high	OS version is below the required minimum	2026-05-12 10:04:12.679532	t	2026-05-12 11:26:30.535326
80	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 10:57:21.590154	t	2026-05-12 11:26:30.535326
81	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-12 10:57:21.649466	t	2026-05-12 11:26:30.603469
82	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-12 11:26:30.535326	t	2026-05-12 12:01:20.204753
83	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 11:26:30.603469	t	2026-05-12 12:01:20.233966
85	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 12:01:20.000522	t	2026-05-13 05:21:23.772137
87	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-12 12:01:20.073274	t	2026-05-13 05:21:23.882923
88	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-12 12:01:20.10481	t	2026-05-13 05:21:23.946241
89	1	1	screen_lock	high	Screen lock is not configured	2026-05-12 12:01:20.147335	t	2026-05-13 05:21:24.010378
90	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-12 12:01:20.147335	t	2026-05-13 05:21:24.010378
91	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-12 12:01:20.233966	t	2026-05-13 05:21:24.213498
84	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-12 12:01:20.000522	t	2026-05-13 05:36:23.73568
86	2	11	os_update	high	OS version is below the required minimum	2026-05-12 12:01:20.073274	t	2026-05-13 05:36:23.826982
92	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 05:21:23.882923	t	2026-05-13 05:36:23.826982
93	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 05:21:23.946241	t	2026-05-13 05:36:23.904095
94	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 05:21:24.010378	t	2026-05-13 05:36:24.010077
96	3	3	os_update	high	OS version is below the required minimum	2026-05-13 05:21:24.137391	t	2026-05-13 05:36:24.17617
97	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 05:21:24.137391	t	2026-05-13 05:36:24.17617
98	1	10	os_update	high	OS version is below the required minimum	2026-05-13 05:21:24.213498	t	2026-05-13 05:36:24.234454
99	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-13 05:21:24.213498	t	2026-05-13 05:36:24.234454
100	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 05:36:23.73568	t	2026-05-13 05:51:23.740068
101	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 05:36:23.904095	t	2026-05-13 05:51:23.897067
95	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 05:21:24.010378	t	2026-05-13 05:51:23.969857
102	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 05:36:24.17617	t	2026-05-13 05:51:24.142344
103	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 05:36:24.234454	t	2026-05-13 05:51:24.23363
104	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 05:51:23.740068	t	2026-05-13 06:06:23.744468
106	3	3	os_update	high	OS version is below the required minimum	2026-05-13 05:51:24.142344	t	2026-05-13 06:06:23.895911
107	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 05:51:24.142344	t	2026-05-13 06:06:23.895911
108	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 05:51:24.23363	t	2026-05-13 06:06:23.913209
109	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-13 06:06:23.744468	t	2026-05-13 06:21:23.826557
110	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 06:06:23.789671	t	2026-05-13 06:21:23.856523
111	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-13 06:06:23.811191	t	2026-05-13 06:21:23.882238
1223	6	25	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:23:10.599344	t	2026-05-18 11:53:10.72121
114	4	13	os_update	high	OS version is below the required minimum	2026-05-13 06:21:23.826557	t	2026-05-13 06:36:23.820638
116	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 06:21:23.882238	t	2026-05-13 06:36:23.888327
117	1	1	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 06:21:23.909449	t	2026-05-13 06:36:23.921463
105	2	2	os_update	high	OS version is below the required minimum	2026-05-13 05:51:24.052042	t	2026-05-13 06:36:23.970841
118	3	3	os_update	high	OS version is below the required minimum	2026-05-13 06:36:23.746031	t	2026-05-13 06:51:23.735206
112	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 06:21:23.774808	t	2026-05-13 06:51:23.786057
123	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 06:51:23.735206	t	2026-05-13 07:06:23.749545
113	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 06:21:23.774808	t	2026-05-13 06:36:23.797606
115	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 06:21:23.826557	t	2026-05-13 06:36:23.820638
121	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 06:36:23.820638	t	2026-05-13 06:51:23.818312
122	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 06:36:23.921463	t	2026-05-13 06:51:23.940054
1250	4	28	screen_lock	high	Screen lock is not configured	2026-05-18 11:23:11.456507	t	2026-05-18 11:38:10.722544
1252	4	28	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:23:11.456507	t	2026-05-18 11:38:10.722544
1224	11	18	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:23:10.650673	t	2026-05-18 11:38:10.805441
1225	11	18	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:10.650673	t	2026-05-18 11:38:10.805441
1226	11	18	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:23:10.650673	t	2026-05-18 11:38:10.805441
1228	4	22	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:23:10.755881	t	2026-05-18 11:38:10.955341
1229	4	22	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:10.755881	t	2026-05-18 11:38:10.955341
1230	4	22	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:23:10.755881	t	2026-05-18 11:38:10.955341
1237	4	36	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:23:10.968319	t	2026-05-18 11:38:11.301324
1241	1	1	screen_lock	high	Screen lock is not configured	2026-05-18 11:23:11.052578	t	2026-05-18 11:38:11.47074
1242	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:11.052578	t	2026-05-18 11:38:11.47074
1243	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:23:11.052578	t	2026-05-18 11:38:11.47074
1222	7	15	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:23:10.539913	t	2026-05-18 11:38:11.792982
1247	7	20	os_update	high	OS version is below the required minimum	2026-05-18 11:23:11.370037	t	2026-05-18 11:38:11.977209
1269	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:38:11.628946	t	2026-05-18 11:53:10.538052
1273	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:38:11.929492	t	2026-05-18 11:53:10.774376
1256	11	24	os_update	high	OS version is below the required minimum	2026-05-18 11:38:10.676468	t	2026-05-18 11:53:10.860001
1251	4	28	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:11.456507	t	2026-05-18 11:53:10.883364
1261	4	22	os_update	high	OS version is below the required minimum	2026-05-18 11:38:10.955341	t	2026-05-18 11:53:11.068582
1265	4	36	os_update	high	OS version is below the required minimum	2026-05-18 11:38:11.301324	t	2026-05-18 11:53:11.252178
1266	1	1	os_update	high	OS version is below the required minimum	2026-05-18 11:38:11.47074	t	2026-05-18 11:53:11.333345
1293	11	38	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:11.000245	t	2026-05-18 12:08:10.695956
1264	5	37	os_update	high	OS version is below the required minimum	2026-05-18 11:38:11.132451	t	2026-05-18 12:08:10.92724
1304	8	21	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:11.267672	t	2026-05-18 12:08:11.102607
1275	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:53:10.538052	t	2026-05-18 12:08:11.223006
1276	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:10.538052	t	2026-05-18 12:08:11.223006
1288	3	3	os_update	high	OS version is below the required minimum	2026-05-18 11:53:10.830677	t	2026-05-18 12:08:11.59657
1289	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:53:10.830677	t	2026-05-18 12:08:11.59657
1307	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:53:11.358133	t	2026-05-18 12:08:11.735445
1308	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:53:11.358133	t	2026-05-18 12:08:11.735445
1296	5	23	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:53:11.098554	t	2026-05-18 12:23:10.580566
119	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 06:36:23.746031	t	2026-05-13 06:51:23.735206
120	1	10	os_update	high	OS version is below the required minimum	2026-05-13 06:36:23.797606	t	2026-05-13 06:51:23.786057
124	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 06:51:23.735206	t	2026-05-13 07:06:23.749545
125	4	13	os_update	high	OS version is below the required minimum	2026-05-13 06:51:23.818312	t	2026-05-13 07:06:23.841512
126	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-13 06:51:23.818312	t	2026-05-13 07:06:23.841512
127	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 06:51:23.818312	t	2026-05-13 07:06:23.841512
128	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 06:51:23.867461	t	2026-05-13 07:06:23.877367
129	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-13 06:51:23.940054	t	2026-05-13 07:06:23.945781
130	2	2	os_update	high	OS version is below the required minimum	2026-05-13 06:51:23.98172	t	2026-05-13 07:06:23.975701
131	1	10	os_update	high	OS version is below the required minimum	2026-05-13 07:06:23.797511	t	2026-05-13 07:21:23.781966
132	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 07:06:23.797511	t	2026-05-13 07:21:23.781966
133	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 07:06:23.797511	t	2026-05-13 07:21:23.781966
134	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 07:06:23.841512	t	2026-05-13 07:21:23.822608
135	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 07:06:23.841512	t	2026-05-13 07:21:23.822608
136	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 07:06:23.877367	t	2026-05-13 07:21:23.861759
137	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 07:06:23.895078	t	2026-05-13 07:21:23.894801
138	3	12	os_update	high	OS version is below the required minimum	2026-05-13 07:06:23.895078	t	2026-05-13 07:21:23.894801
139	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 07:06:23.895078	t	2026-05-13 07:21:23.894801
140	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 07:21:23.74357	t	2026-05-13 07:36:23.745925
141	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 07:21:23.74357	t	2026-05-13 07:36:23.745925
142	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 07:21:23.781966	t	2026-05-13 07:36:23.792521
143	4	13	screen_lock	high	Screen lock is not configured	2026-05-13 07:21:23.822608	t	2026-05-13 07:36:23.832018
144	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 07:21:23.861759	t	2026-05-13 07:36:23.873605
145	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 07:21:23.894801	t	2026-05-13 07:36:23.909748
146	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 07:21:23.966296	t	2026-05-13 07:36:23.989606
147	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 07:21:23.966296	t	2026-05-13 07:36:23.989606
148	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 07:36:23.792521	t	2026-05-13 08:21:23.807737
150	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 07:36:23.909748	t	2026-05-13 08:21:23.953127
151	3	3	os_update	high	OS version is below the required minimum	2026-05-13 08:21:23.750063	t	2026-05-13 08:36:23.744193
153	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 08:21:23.750063	t	2026-05-13 08:36:23.744193
149	4	13	os_update	high	OS version is below the required minimum	2026-05-13 07:36:23.832018	t	2026-05-13 08:36:23.815344
154	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 08:21:23.845122	t	2026-05-13 08:36:23.815344
155	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 08:21:23.898825	t	2026-05-13 08:36:23.842977
156	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 08:21:23.898825	t	2026-05-13 08:36:23.842977
157	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 08:21:23.898825	t	2026-05-13 08:36:23.842977
158	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 08:21:23.953127	t	2026-05-13 08:36:23.881013
159	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-13 08:21:23.953127	t	2026-05-13 08:36:23.881013
160	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 08:21:23.953127	t	2026-05-13 08:36:23.881013
161	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 08:21:24.048192	t	2026-05-13 08:36:23.947055
162	2	11	os_update	high	OS version is below the required minimum	2026-05-13 08:36:23.842977	t	2026-05-13 08:51:23.799345
163	1	1	os_update	high	OS version is below the required minimum	2026-05-13 08:36:23.909811	t	2026-05-13 08:51:23.87005
164	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 08:36:23.909811	t	2026-05-13 08:51:23.87005
165	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 08:36:23.947055	t	2026-05-13 08:51:23.91392
166	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 08:36:23.947055	t	2026-05-13 08:51:23.91392
152	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-13 08:21:23.750063	t	2026-05-13 08:51:23.946646
167	4	13	os_update	high	OS version is below the required minimum	2026-05-13 08:51:23.74176	t	2026-05-13 09:06:23.735459
168	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 08:51:23.74176	t	2026-05-13 09:06:23.735459
169	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 08:51:23.838914	t	2026-05-13 09:06:23.796549
170	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 08:51:23.838914	t	2026-05-13 09:06:23.796549
171	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 08:51:23.87005	t	2026-05-13 09:06:23.824546
172	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 08:51:23.91392	t	2026-05-13 09:06:23.841516
173	1	10	os_update	high	OS version is below the required minimum	2026-05-13 08:51:23.979012	t	2026-05-13 09:06:23.904267
1234	1	33	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:23:10.904369	t	2026-05-18 11:38:11.186763
174	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 09:06:23.796549	t	2026-05-13 09:21:23.834875
175	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 09:06:23.824546	t	2026-05-13 09:21:23.881375
179	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 09:21:23.786834	t	2026-05-13 09:36:23.846815
181	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 09:21:23.881375	t	2026-05-13 09:36:23.943181
182	2	2	os_update	high	OS version is below the required minimum	2026-05-13 09:21:23.928976	t	2026-05-13 09:36:23.993519
184	4	13	os_update	high	OS version is below the required minimum	2026-05-13 09:36:23.746271	t	2026-05-13 09:51:23.738764
180	3	12	os_update	high	OS version is below the required minimum	2026-05-13 09:21:23.834875	t	2026-05-13 10:06:23.846629
177	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 09:06:23.871459	t	2026-05-13 09:21:23.976006
183	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 09:21:23.928976	t	2026-05-13 09:36:23.993519
1249	11	24	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:23:11.427429	t	2026-05-18 11:38:10.676468
1227	2	34	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:10.688845	t	2026-05-18 11:38:10.85524
1231	5	23	os_update	high	OS version is below the required minimum	2026-05-18 11:23:10.800592	t	2026-05-18 11:38:11.00612
1232	8	32	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:10.839578	t	2026-05-18 11:38:11.070092
1233	8	32	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:23:10.839578	t	2026-05-18 11:38:11.070092
1235	1	33	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:23:10.904369	t	2026-05-18 11:38:11.186763
1236	3	35	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:23:10.9363	t	2026-05-18 11:38:11.236758
1238	8	21	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:23:10.99563	t	2026-05-18 11:38:11.36098
1239	7	26	os_update	high	OS version is below the required minimum	2026-05-18 11:23:11.025538	t	2026-05-18 11:38:11.412557
1240	7	26	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:23:11.025538	t	2026-05-18 11:38:11.412557
1270	8	27	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:38:11.842422	t	2026-05-18 11:53:10.704165
1271	8	27	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:38:11.842422	t	2026-05-18 11:53:10.704165
1272	8	27	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:38:11.842422	t	2026-05-18 11:53:10.704165
1248	11	24	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:11.427429	t	2026-05-18 11:53:10.860001
1257	4	28	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:38:10.722544	t	2026-05-18 11:53:10.883364
1258	2	34	screen_lock	high	Screen lock is not configured	2026-05-18 11:38:10.85524	t	2026-05-18 11:53:10.967606
1262	5	23	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:38:11.00612	t	2026-05-18 11:53:11.098554
1267	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:38:11.524918	t	2026-05-18 11:53:11.358133
1297	8	32	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:53:11.129844	t	2026-05-18 12:08:10.886132
1298	8	32	password_expiry	low	Password has not been changed within the required period	2026-05-18 11:53:11.129844	t	2026-05-18 12:08:10.886132
1299	8	32	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:11.129844	t	2026-05-18 12:08:10.886132
1305	7	26	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:53:11.299324	t	2026-05-18 12:08:11.134455
1277	6	30	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:53:10.598827	t	2026-05-18 12:08:11.262994
1278	6	30	os_update	high	OS version is below the required minimum	2026-05-18 11:53:10.598827	t	2026-05-18 12:08:11.262994
1279	6	30	password_expiry	low	Password has not been changed within the required period	2026-05-18 11:53:10.598827	t	2026-05-18 12:08:11.262994
1280	6	30	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:10.598827	t	2026-05-18 12:08:11.262994
1283	2	11	screen_lock	high	Screen lock is not configured	2026-05-18 11:53:10.774376	t	2026-05-18 12:08:11.498101
1284	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:53:10.774376	t	2026-05-18 12:08:11.498101
1274	7	20	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:38:11.977209	t	2026-05-18 12:08:11.547863
1290	11	24	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:10.860001	t	2026-05-18 12:08:11.637475
1309	6	14	os_update	high	OS version is below the required minimum	2026-05-18 11:53:11.382359	t	2026-05-18 12:08:11.775825
1245	6	14	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:23:11.114458	t	2026-05-18 12:08:11.775825
1306	7	26	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:11.299324	t	2026-05-18 12:23:11.007794
178	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-13 09:21:23.740425	t	2026-05-13 09:36:23.746271
176	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 09:06:23.841516	t	2026-05-13 09:36:23.993519
185	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 09:36:23.746271	t	2026-05-13 09:51:23.738764
186	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 09:36:23.902255	t	2026-05-13 09:51:23.823247
187	3	3	os_update	high	OS version is below the required minimum	2026-05-13 09:36:24.035333	t	2026-05-13 09:51:23.960192
188	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 09:36:24.035333	t	2026-05-13 09:51:23.960192
189	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 09:36:24.035333	t	2026-05-13 09:51:23.960192
190	1	10	os_update	high	OS version is below the required minimum	2026-05-13 09:36:24.071784	t	2026-05-13 09:51:24.003421
191	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 09:51:23.823247	t	2026-05-13 10:06:23.846629
193	1	1	os_update	high	OS version is below the required minimum	2026-05-13 09:51:23.850043	t	2026-05-13 10:06:23.901769
194	2	2	screen_lock	high	Screen lock is not configured	2026-05-13 09:51:23.912481	t	2026-05-13 10:06:23.939998
195	3	3	screen_lock	high	Screen lock is not configured	2026-05-13 09:51:23.960192	t	2026-05-13 10:06:23.983108
196	1	10	screen_lock	high	Screen lock is not configured	2026-05-13 09:51:24.003421	t	2026-05-13 10:06:24.034579
197	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 09:51:24.003421	t	2026-05-13 10:06:24.034579
198	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 10:06:23.733184	t	2026-05-13 10:21:23.741098
199	2	11	screen_lock	high	Screen lock is not configured	2026-05-13 10:06:23.798933	t	2026-05-13 10:21:23.790946
192	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 09:51:23.823247	t	2026-05-13 10:21:23.824795
202	3	3	os_update	high	OS version is below the required minimum	2026-05-13 10:06:23.983108	t	2026-05-13 10:21:23.92297
203	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-13 10:06:24.034579	t	2026-05-13 10:21:23.951831
204	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 10:06:24.034579	t	2026-05-13 10:21:23.951831
205	4	13	os_update	high	OS version is below the required minimum	2026-05-13 10:21:23.741098	t	2026-05-13 10:36:23.78627
206	2	11	os_update	high	OS version is below the required minimum	2026-05-13 10:21:23.790946	t	2026-05-13 10:36:23.830332
207	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-13 10:21:23.790946	t	2026-05-13 10:36:23.830332
208	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 10:21:23.790946	t	2026-05-13 10:36:23.830332
209	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 10:21:23.824795	t	2026-05-13 10:36:23.867972
200	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 10:06:23.939998	t	2026-05-13 10:36:24.011167
210	1	10	os_update	high	OS version is below the required minimum	2026-05-13 10:21:23.951831	t	2026-05-13 10:51:23.75388
212	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 10:36:23.867972	t	2026-05-13 10:51:24.034073
213	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-13 10:36:24.011167	t	2026-05-13 10:51:24.124428
214	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 10:36:24.011167	t	2026-05-13 10:51:24.124428
201	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 10:06:23.939998	t	2026-05-13 10:51:24.124428
215	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-13 10:36:24.081743	t	2026-05-13 10:51:24.161591
216	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 10:51:23.75388	t	2026-05-13 11:06:23.739049
217	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 10:51:23.75388	t	2026-05-13 11:06:23.739049
211	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 10:36:23.736307	t	2026-05-13 11:06:23.739049
218	4	13	os_update	high	OS version is below the required minimum	2026-05-13 10:51:23.900188	t	2026-05-13 11:06:23.779141
219	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 10:51:23.900188	t	2026-05-13 11:06:23.779141
220	2	11	screen_lock	high	Screen lock is not configured	2026-05-13 10:51:23.99127	t	2026-05-13 11:06:23.821543
221	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 10:51:23.99127	t	2026-05-13 11:06:23.821543
222	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 10:51:24.034073	t	2026-05-13 11:06:23.854855
223	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-13 10:51:24.080702	t	2026-05-13 11:06:23.885441
224	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 10:51:24.080702	t	2026-05-13 11:06:23.885441
225	2	2	screen_lock	high	Screen lock is not configured	2026-05-13 10:51:24.124428	t	2026-05-13 11:06:23.914506
226	2	2	os_update	high	OS version is below the required minimum	2026-05-13 10:51:24.124428	t	2026-05-13 11:06:23.914506
229	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 11:06:23.779141	t	2026-05-13 11:21:23.777088
230	2	11	os_update	high	OS version is below the required minimum	2026-05-13 11:06:23.821543	t	2026-05-13 11:21:23.812799
231	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 11:06:23.821543	t	2026-05-13 11:21:23.812799
232	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-13 11:06:23.854855	t	2026-05-13 11:21:23.837751
227	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 10:51:24.124428	t	2026-05-13 11:21:23.89777
228	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 11:06:23.779141	t	2026-05-13 11:36:23.788669
233	4	13	os_update	high	OS version is below the required minimum	2026-05-13 11:21:23.777088	t	2026-05-13 11:36:23.788669
234	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 11:21:23.837751	t	2026-05-13 11:36:23.873401
235	1	1	screen_lock	high	Screen lock is not configured	2026-05-13 11:21:23.863537	t	2026-05-13 11:36:23.907068
236	1	1	os_update	high	OS version is below the required minimum	2026-05-13 11:21:23.863537	t	2026-05-13 11:36:23.907068
238	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 11:21:23.89777	t	2026-05-13 11:36:23.937441
240	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 11:21:23.931563	t	2026-05-13 11:36:23.972072
239	2	2	os_update	high	OS version is below the required minimum	2026-05-13 11:21:23.89777	t	2026-05-13 11:51:23.949674
246	1	10	os_update	high	OS version is below the required minimum	2026-05-13 11:51:23.741983	t	2026-05-13 12:06:23.737299
1244	2	2	os_update	high	OS version is below the required minimum	2026-05-18 11:23:11.084161	t	2026-05-18 11:38:11.524918
237	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 11:21:23.863537	t	2026-05-13 11:36:23.907068
242	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 11:36:23.788669	t	2026-05-13 11:51:23.789271
243	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 11:36:23.873401	t	2026-05-13 11:51:23.876455
244	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 11:36:23.937441	t	2026-05-13 11:51:23.949674
245	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 11:36:23.972072	t	2026-05-13 11:51:24.000052
247	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-13 11:51:23.741983	t	2026-05-13 12:06:23.737299
252	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 12:06:23.737299	t	2026-05-14 05:49:14.542592
253	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 12:06:23.737299	t	2026-05-14 05:49:14.542592
1253	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:23:11.488721	t	2026-05-18 11:38:10.756768
1246	6	19	os_update	high	OS version is below the required minimum	2026-05-18 11:23:11.290314	t	2026-05-18 11:38:11.886224
1254	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:38:10.603349	t	2026-05-18 11:53:10.830677
1255	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:38:10.603349	t	2026-05-18 11:53:10.830677
1260	11	38	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:38:10.903344	t	2026-05-18 11:53:11.000245
1263	8	32	os_update	high	OS version is below the required minimum	2026-05-18 11:38:11.070092	t	2026-05-18 11:53:11.129844
1268	6	14	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:38:11.577532	t	2026-05-18 11:53:11.382359
1292	2	34	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:53:10.967606	t	2026-05-18 12:08:10.645993
1259	11	38	screen_lock	high	Screen lock is not configured	2026-05-18 11:38:10.903344	t	2026-05-18 12:08:10.695956
1294	4	22	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:53:11.068582	t	2026-05-18 12:08:10.778833
1301	5	37	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:53:11.165508	t	2026-05-18 12:08:10.92724
1302	4	36	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:53:11.252178	t	2026-05-18 12:08:11.058291
1303	4	36	password_expiry	low	Password has not been changed within the required period	2026-05-18 11:53:11.252178	t	2026-05-18 12:08:11.058291
1282	6	25	os_update	high	OS version is below the required minimum	2026-05-18 11:53:10.72121	t	2026-05-18 12:08:11.418595
1285	7	20	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:53:10.803136	t	2026-05-18 12:08:11.547863
1286	7	20	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:53:10.803136	t	2026-05-18 12:08:11.547863
1287	7	20	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:53:10.803136	t	2026-05-18 12:08:11.547863
1295	4	22	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:11.068582	t	2026-05-18 12:23:10.533153
1300	5	37	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:53:11.165508	t	2026-05-18 12:23:10.666552
1281	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:53:10.646997	t	2026-05-18 12:23:11.202185
1291	4	28	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:53:10.883364	t	2026-05-18 12:23:11.79914
241	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 11:36:23.739654	t	2026-05-13 11:51:23.741983
248	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 11:51:23.741983	t	2026-05-13 12:06:23.737299
249	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 11:51:23.789271	t	2026-05-13 12:06:23.836825
250	2	11	os_update	high	OS version is below the required minimum	2026-05-13 11:51:23.833629	t	2026-05-13 12:06:23.903221
251	3	3	screen_lock	high	Screen lock is not configured	2026-05-13 11:51:24.000052	t	2026-05-13 12:06:24.198199
254	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-13 12:06:23.903221	t	2026-05-14 05:49:14.64273
255	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-13 12:06:23.989015	t	2026-05-14 05:49:14.674825
256	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 12:06:23.989015	t	2026-05-14 05:49:14.674825
257	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-13 12:06:24.053731	t	2026-05-14 05:49:14.700148
258	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-13 12:06:24.124841	t	2026-05-14 05:49:14.725389
259	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-13 12:06:24.198199	t	2026-05-14 05:49:14.755825
261	2	11	os_update	high	OS version is below the required minimum	2026-05-14 05:49:14.64273	t	2026-05-14 06:04:14.540861
262	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 05:49:14.725389	t	2026-05-14 06:04:14.695823
263	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 05:49:14.755825	t	2026-05-14 06:04:14.729413
260	1	10	os_update	high	OS version is below the required minimum	2026-05-14 05:49:14.542592	t	2026-05-14 06:04:14.758689
265	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 06:04:14.650517	t	2026-05-14 06:19:14.597451
266	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-14 06:04:14.729413	t	2026-05-14 06:19:14.648085
267	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 06:04:14.729413	t	2026-05-14 06:19:14.648085
268	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 06:04:14.758689	t	2026-05-14 06:19:14.682464
269	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 06:04:14.758689	t	2026-05-14 06:19:14.682464
270	4	13	os_update	high	OS version is below the required minimum	2026-05-14 06:04:14.800666	t	2026-05-14 06:19:14.712937
271	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 06:04:14.800666	t	2026-05-14 06:19:14.712937
272	2	11	os_update	high	OS version is below the required minimum	2026-05-14 06:19:14.529973	t	2026-05-14 06:34:14.530402
273	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 06:19:14.529973	t	2026-05-14 06:34:14.530402
275	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 06:19:14.566474	t	2026-05-14 06:34:14.578792
264	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-14 06:04:14.650517	t	2026-05-14 06:34:14.609316
277	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 06:19:14.628594	t	2026-05-14 06:34:14.634316
278	3	3	screen_lock	high	Screen lock is not configured	2026-05-14 06:19:14.648085	t	2026-05-14 06:34:14.663501
279	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 06:19:14.682464	t	2026-05-14 06:34:14.696116
280	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-14 06:34:14.530402	t	2026-05-14 06:49:14.530538
281	3	12	screen_lock	high	Screen lock is not configured	2026-05-14 06:34:14.578792	t	2026-05-14 06:49:14.580139
282	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-14 06:34:14.578792	t	2026-05-14 06:49:14.580139
276	1	1	os_update	high	OS version is below the required minimum	2026-05-14 06:19:14.597451	t	2026-05-14 06:49:14.613071
284	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 06:34:14.696116	t	2026-05-14 06:49:14.714638
286	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 06:34:14.726586	t	2026-05-14 06:49:14.758675
287	3	12	os_update	high	OS version is below the required minimum	2026-05-14 06:49:14.580139	t	2026-05-14 07:04:14.571074
274	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 06:19:14.566474	t	2026-05-14 07:04:14.571074
288	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 06:49:14.613071	t	2026-05-14 07:04:14.59421
289	2	2	os_update	high	OS version is below the required minimum	2026-05-14 06:49:14.649932	t	2026-05-14 07:04:14.635644
290	1	10	os_update	high	OS version is below the required minimum	2026-05-14 06:49:14.714638	t	2026-05-14 07:04:14.691211
285	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 06:34:14.696116	t	2026-05-14 07:04:14.691211
292	4	13	screen_lock	high	Screen lock is not configured	2026-05-14 06:49:14.758675	t	2026-05-14 07:04:14.714912
293	2	11	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 07:04:14.531789	t	2026-05-14 07:19:14.520544
294	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 07:04:14.531789	t	2026-05-14 07:19:14.520544
295	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 07:04:14.531789	t	2026-05-14 07:19:14.520544
283	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 06:34:14.609316	t	2026-05-14 07:19:14.6036
296	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 07:04:14.635644	t	2026-05-14 07:19:14.634855
297	1	10	screen_lock	high	Screen lock is not configured	2026-05-14 07:04:14.691211	t	2026-05-14 07:19:14.708995
298	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 07:04:14.691211	t	2026-05-14 07:19:14.708995
291	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 06:49:14.714638	t	2026-05-14 07:19:14.708995
299	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 07:19:14.6036	t	2026-05-14 07:34:14.631304
301	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 07:19:14.634855	t	2026-05-14 07:34:14.683771
302	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 07:19:14.672663	t	2026-05-14 07:34:14.728373
303	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-14 07:19:14.672663	t	2026-05-14 07:34:14.728373
305	3	3	os_update	high	OS version is below the required minimum	2026-05-14 07:34:14.728373	t	2026-05-14 08:34:14.793215
311	2	11	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 08:34:14.657	t	2026-05-14 08:49:14.611567
300	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 07:19:14.634855	t	2026-05-14 08:49:14.778088
307	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 07:34:14.776613	t	2026-05-14 08:49:14.92217
375	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 11:04:14.655681	t	2026-05-14 11:19:14.646388
308	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-14 07:34:14.821941	t	2026-05-14 08:34:14.535672
309	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 07:34:14.821941	t	2026-05-14 08:34:14.535672
306	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-14 07:34:14.776613	t	2026-05-14 08:34:14.834179
310	4	13	os_update	high	OS version is below the required minimum	2026-05-14 08:34:14.535672	t	2026-05-14 08:49:14.530247
315	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 08:34:14.733998	t	2026-05-14 08:49:14.721151
316	1	1	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 08:34:14.733998	t	2026-05-14 08:49:14.721151
304	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-14 07:34:14.683771	t	2026-05-14 08:49:14.778088
318	1	10	screen_lock	high	Screen lock is not configured	2026-05-14 08:34:14.834179	t	2026-05-14 08:49:14.92217
322	2	2	os_update	high	OS version is below the required minimum	2026-05-14 08:49:14.778088	t	2026-05-14 09:04:14.777821
319	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 08:49:14.611567	t	2026-05-14 09:19:14.60456
1316	5	23	os_update	high	OS version is below the required minimum	2026-05-18 12:08:10.835467	t	2026-05-18 12:23:10.580566
1317	5	23	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:08:10.835467	t	2026-05-18 12:23:10.580566
1335	1	33	os_update	high	OS version is below the required minimum	2026-05-18 12:23:10.711598	f	\N
1318	1	33	password_length	medium	Password is shorter than the required minimum	2026-05-18 12:08:10.96291	t	2026-05-18 12:23:10.711598
1346	6	30	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 12:23:11.157871	f	\N
1324	7	15	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:08:11.338689	t	2026-05-18 12:23:11.241055
1327	6	19	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:08:11.457443	t	2026-05-18 12:23:11.357811
1353	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:23:11.393156	f	\N
1329	3	3	screen_lock	high	Screen lock is not configured	2026-05-18 12:08:11.59657	t	2026-05-18 12:23:11.474477
1311	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-18 12:08:10.530015	t	2026-05-18 12:23:11.569949
1313	11	38	os_update	high	OS version is below the required minimum	2026-05-18 12:08:10.695956	t	2026-05-18 12:23:11.710037
1359	3	3	screen_lock	high	Screen lock is not configured	2026-05-18 13:23:10.536174	f	\N
1356	11	24	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:23:11.516964	t	2026-05-18 13:23:10.605761
1357	11	24	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:23:11.516964	t	2026-05-18 13:23:10.605761
1360	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 13:23:10.689211	f	\N
1361	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 13:23:10.689211	f	\N
1365	11	38	os_update	high	OS version is below the required minimum	2026-05-18 13:23:10.895871	f	\N
1372	1	33	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 13:23:11.355388	f	\N
1319	1	33	password_expiry	low	Password has not been changed within the required period	2026-05-18 12:08:10.96291	t	2026-05-18 13:23:11.355388
1336	1	33	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:23:10.711598	t	2026-05-18 13:23:11.355388
1374	8	21	password_length	medium	Password is shorter than the required minimum	2026-05-18 13:23:11.823422	f	\N
1375	8	21	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 13:23:11.823422	f	\N
1377	3	12	screen_lock	high	Screen lock is not configured	2026-05-18 13:23:12.047512	f	\N
1378	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 13:23:12.047512	f	\N
1322	3	12	os_update	high	OS version is below the required minimum	2026-05-18 12:08:11.223006	t	2026-05-18 13:23:12.047512
1345	6	30	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:23:11.157871	t	2026-05-18 13:23:12.136731
1347	6	30	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:23:11.157871	t	2026-05-18 13:23:12.136731
1383	7	15	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 13:23:12.295565	f	\N
1350	8	27	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 12:23:11.27745	t	2026-05-18 13:23:12.371912
312	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 08:34:14.657	t	2026-05-14 08:49:14.611567
317	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 08:34:14.761152	t	2026-05-14 08:49:14.778088
321	1	1	os_update	high	OS version is below the required minimum	2026-05-14 08:49:14.721151	t	2026-05-14 09:04:14.716613
323	1	10	os_update	high	OS version is below the required minimum	2026-05-14 08:49:14.92217	t	2026-05-14 09:04:14.897203
1323	4	13	os_update	high	OS version is below the required minimum	2026-05-18 12:08:11.309033	f	\N
1315	4	22	os_update	high	OS version is below the required minimum	2026-05-18 12:08:10.778833	t	2026-05-18 12:23:10.533153
1321	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:08:11.179565	t	2026-05-18 12:23:11.065011
1312	2	34	screen_lock	high	Screen lock is not configured	2026-05-18 12:08:10.645993	t	2026-05-18 12:23:11.665875
1314	1	6	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:08:10.737878	t	2026-05-18 12:23:11.758508
1331	4	28	os_update	high	OS version is below the required minimum	2026-05-18 12:08:11.684584	t	2026-05-18 12:23:11.79914
1332	4	28	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 12:08:11.684584	t	2026-05-18 12:23:11.79914
1363	2	34	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 13:23:10.827575	f	\N
1364	2	34	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 13:23:10.827575	f	\N
1369	5	37	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 13:23:11.280724	f	\N
1370	5	37	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 13:23:11.280724	f	\N
1371	5	37	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 13:23:11.280724	f	\N
1373	6	14	os_update	high	OS version is below the required minimum	2026-05-18 13:23:11.505639	f	\N
1339	6	14	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:23:10.811032	t	2026-05-18 13:23:11.505639
1342	8	21	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 12:23:10.958008	t	2026-05-18 13:23:11.823422
1343	8	21	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:23:10.958008	t	2026-05-18 13:23:11.823422
1376	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 13:23:11.968587	f	\N
1381	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 13:23:12.216129	f	\N
1382	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 13:23:12.216129	f	\N
1349	7	15	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 12:23:11.241055	t	2026-05-18 13:23:12.295565
1384	6	25	password_length	medium	Password is shorter than the required minimum	2026-05-18 13:23:12.451277	f	\N
1352	6	19	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:23:11.357811	t	2026-05-18 13:23:12.52318
313	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 08:34:14.697599	t	2026-05-14 08:49:14.667633
314	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 08:34:14.697599	t	2026-05-14 08:49:14.667633
320	3	12	os_update	high	OS version is below the required minimum	2026-05-14 08:49:14.667633	t	2026-05-14 09:19:14.65916
324	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 09:04:14.662504	t	2026-05-14 09:19:14.65916
327	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 09:19:14.60456	t	2026-05-14 09:34:14.578017
328	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 09:19:14.65916	t	2026-05-14 09:34:14.625323
329	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 09:19:14.71567	t	2026-05-14 09:34:14.67216
332	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 09:19:14.770949	t	2026-05-14 09:34:14.719697
334	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-14 09:34:14.536704	t	2026-05-14 09:49:14.540628
335	2	11	screen_lock	high	Screen lock is not configured	2026-05-14 09:34:14.578017	t	2026-05-14 09:49:14.582022
326	2	11	os_update	high	OS version is below the required minimum	2026-05-14 09:19:14.60456	t	2026-05-14 09:49:14.582022
336	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 09:34:14.578017	t	2026-05-14 09:49:14.582022
337	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-14 09:34:14.67216	t	2026-05-14 09:49:14.650152
330	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 09:19:14.71567	t	2026-05-14 09:49:14.650152
331	2	2	os_update	high	OS version is below the required minimum	2026-05-14 09:19:14.770949	t	2026-05-14 09:49:14.686994
338	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-14 09:34:14.719697	t	2026-05-14 09:49:14.686994
333	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 09:19:14.837835	t	2026-05-14 09:49:14.723933
339	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 09:34:14.755917	t	2026-05-14 09:49:14.723933
325	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 09:04:14.897203	t	2026-05-14 09:49:14.770321
340	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 09:49:14.540628	t	2026-05-14 10:04:14.539115
341	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 09:49:14.540628	t	2026-05-14 10:04:14.539115
342	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 09:49:14.540628	t	2026-05-14 10:04:14.539115
343	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 09:49:14.619573	t	2026-05-14 10:04:14.61983
344	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 09:49:14.619573	t	2026-05-14 10:04:14.61983
345	1	1	os_update	high	OS version is below the required minimum	2026-05-14 09:49:14.650152	t	2026-05-14 10:04:14.655714
346	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 09:49:14.650152	t	2026-05-14 10:19:14.67175
349	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 10:04:14.655714	t	2026-05-14 10:19:14.67175
347	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 09:49:14.686994	t	2026-05-14 10:19:14.718873
348	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-14 09:49:14.723933	t	2026-05-14 10:19:14.766524
350	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 10:04:14.802022	t	2026-05-14 10:19:14.81288
355	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 10:19:14.718873	t	2026-05-14 10:34:14.655521
356	2	2	os_update	high	OS version is below the required minimum	2026-05-14 10:19:14.718873	t	2026-05-14 10:34:14.655521
351	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 10:19:14.522792	t	2026-05-14 10:34:14.777439
352	2	11	os_update	high	OS version is below the required minimum	2026-05-14 10:19:14.568501	t	2026-05-14 10:34:14.816115
353	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 10:19:14.568501	t	2026-05-14 10:34:14.816115
358	3	12	screen_lock	high	Screen lock is not configured	2026-05-14 10:34:14.549519	t	2026-05-14 10:49:14.52513
359	3	12	os_update	high	OS version is below the required minimum	2026-05-14 10:34:14.549519	t	2026-05-14 10:49:14.52513
354	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 10:19:14.622648	t	2026-05-14 10:49:14.52513
360	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-14 10:34:14.609521	t	2026-05-14 10:49:14.575214
361	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 10:34:14.609521	t	2026-05-14 10:49:14.575214
362	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 10:34:14.655521	t	2026-05-14 10:49:14.624536
364	1	10	os_update	high	OS version is below the required minimum	2026-05-14 10:34:14.736495	t	2026-05-14 10:49:14.701095
365	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-14 10:34:14.736495	t	2026-05-14 10:49:14.701095
357	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 10:19:14.81288	t	2026-05-14 10:49:14.701095
366	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 10:34:14.777439	t	2026-05-14 10:49:14.747548
367	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-14 10:34:14.777439	t	2026-05-14 10:49:14.747548
368	3	3	os_update	high	OS version is below the required minimum	2026-05-14 10:49:14.658177	t	2026-05-14 11:04:14.655681
363	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 10:34:14.703287	t	2026-05-14 11:04:14.655681
369	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 10:49:14.701095	t	2026-05-14 11:04:14.688503
370	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 10:49:14.701095	t	2026-05-14 11:04:14.688503
372	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 10:49:14.747548	t	2026-05-14 11:04:14.719331
1320	3	35	os_update	high	OS version is below the required minimum	2026-05-18 12:08:11.01836	t	2026-05-18 13:23:11.588445
374	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 11:04:14.655681	t	2026-05-14 11:19:14.646388
371	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 10:49:14.701095	t	2026-05-14 11:19:14.677322
373	2	11	os_update	high	OS version is below the required minimum	2026-05-14 10:49:14.786791	t	2026-05-14 11:19:14.73582
383	4	13	os_update	high	OS version is below the required minimum	2026-05-14 11:19:14.702412	t	2026-05-14 11:34:14.681725
385	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 11:34:14.521793	t	2026-05-14 11:49:14.521447
386	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 11:34:14.556227	t	2026-05-14 11:49:14.602709
380	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 11:19:14.604846	t	2026-05-14 11:49:14.653025
379	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 11:19:14.566221	t	2026-05-14 12:04:14.601015
377	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-14 11:04:14.748065	t	2026-05-14 11:19:14.73582
381	3	3	os_update	high	OS version is below the required minimum	2026-05-14 11:19:14.646388	t	2026-05-14 11:34:14.617447
382	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 11:19:14.646388	t	2026-05-14 11:34:14.617447
384	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 11:19:14.73582	t	2026-05-14 11:34:14.71034
389	2	11	os_update	high	OS version is below the required minimum	2026-05-14 11:34:14.71034	t	2026-05-14 11:49:14.82093
390	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-14 11:34:14.71034	t	2026-05-14 11:49:14.82093
392	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 11:49:14.602709	t	2026-05-14 12:04:14.601015
407	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-14 12:19:14.750252	t	2026-05-15 05:04:14.759551
400	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 12:04:14.790482	t	2026-05-15 05:04:14.888146
411	2	11	os_update	high	OS version is below the required minimum	2026-05-15 05:04:14.528428	t	2026-05-15 05:19:14.532293
412	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 05:04:14.528428	t	2026-05-15 05:19:14.532293
414	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 05:04:14.759551	t	2026-05-15 05:19:14.65568
410	4	13	os_update	high	OS version is below the required minimum	2026-05-14 12:19:14.929955	t	2026-05-15 05:19:14.766525
415	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 05:04:14.954726	t	2026-05-15 05:19:14.766525
417	3	3	os_update	high	OS version is below the required minimum	2026-05-15 05:19:14.689213	t	2026-05-15 05:34:14.679195
418	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 05:19:14.689213	t	2026-05-15 05:34:14.679195
419	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 05:19:14.689213	t	2026-05-15 05:49:14.717842
1333	6	14	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 12:08:11.775825	t	2026-05-18 12:23:10.811032
1344	1	1	os_update	high	OS version is below the required minimum	2026-05-18 12:23:11.065011	f	\N
1325	8	27	password_length	medium	Password is shorter than the required minimum	2026-05-18 12:08:11.376498	t	2026-05-18 12:23:11.27745
1328	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-18 12:08:11.498101	t	2026-05-18 12:23:11.393156
1330	11	24	os_update	high	OS version is below the required minimum	2026-05-18 12:08:11.637475	t	2026-05-18 12:23:11.516964
1310	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 12:08:10.530015	t	2026-05-18 12:23:11.569949
1362	11	18	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 13:23:10.763552	f	\N
1358	11	38	password_expiry	low	Password has not been changed within the required period	2026-05-18 12:23:11.710037	t	2026-05-18 13:23:10.895871
1366	1	6	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 13:23:10.982729	f	\N
1367	8	32	password_length	medium	Password is shorter than the required minimum	2026-05-18 13:23:11.201197	f	\N
1368	8	32	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 13:23:11.201197	f	\N
1334	8	32	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 12:23:10.626383	t	2026-05-18 13:23:11.201197
1337	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:23:10.76501	t	2026-05-18 13:23:11.427036
1338	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:23:10.76501	t	2026-05-18 13:23:11.427036
1340	4	36	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 12:23:10.90935	t	2026-05-18 13:23:11.747641
1341	4	36	password_length	medium	Password is shorter than the required minimum	2026-05-18 12:23:10.90935	t	2026-05-18 13:23:11.747641
1379	6	30	os_update	high	OS version is below the required minimum	2026-05-18 13:23:12.136731	f	\N
1380	6	30	password_length	medium	Password is shorter than the required minimum	2026-05-18 13:23:12.136731	f	\N
1348	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 12:23:11.202185	t	2026-05-18 13:23:12.216129
1326	8	27	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 12:08:11.376498	t	2026-05-18 13:23:12.371912
1351	6	25	os_update	high	OS version is below the required minimum	2026-05-18 12:23:11.318883	t	2026-05-18 13:23:12.451277
1354	7	20	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 12:23:11.441179	t	2026-05-18 13:23:12.657761
1355	7	20	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 12:23:11.441179	t	2026-05-18 13:23:12.657761
387	2	2	screen_lock	high	Screen lock is not configured	2026-05-14 11:34:14.592311	t	2026-05-14 11:49:14.653025
388	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 11:34:14.592311	t	2026-05-14 12:04:14.666208
396	4	13	os_update	high	OS version is below the required minimum	2026-05-14 11:49:14.770441	t	2026-05-14 12:04:14.847256
398	2	2	os_update	high	OS version is below the required minimum	2026-05-14 12:04:14.666208	t	2026-05-14 12:19:14.750252
399	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-14 12:04:14.666208	t	2026-05-14 12:19:14.750252
393	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 11:49:14.653025	t	2026-05-14 12:19:14.750252
401	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 12:04:14.847256	t	2026-05-14 12:19:14.929955
405	1	1	os_update	high	OS version is below the required minimum	2026-05-14 12:19:14.666114	t	2026-05-15 05:04:14.693253
406	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 12:19:14.666114	t	2026-05-15 05:04:14.693253
413	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-15 05:04:14.693253	t	2026-05-15 05:19:14.606351
420	1	10	os_update	high	OS version is below the required minimum	2026-05-15 05:19:14.731979	t	2026-05-15 05:34:14.708827
376	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-14 11:04:14.688503	t	2026-05-14 11:34:14.648871
378	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 11:19:14.522605	t	2026-05-14 11:49:14.521447
391	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 11:49:14.521447	t	2026-05-14 12:04:14.519456
394	3	3	os_update	high	OS version is below the required minimum	2026-05-14 11:49:14.686708	t	2026-05-14 12:04:14.725559
395	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 11:49:14.686708	t	2026-05-14 12:04:14.725559
397	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-14 11:49:14.82093	t	2026-05-14 12:04:14.901719
402	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-14 12:04:14.901719	t	2026-05-14 12:19:14.522773
403	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 12:19:14.578285	t	2026-05-15 05:04:14.630598
404	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 12:19:14.578285	t	2026-05-15 05:04:14.630598
409	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-14 12:19:14.827167	t	2026-05-15 05:04:14.822163
408	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-14 12:19:14.827167	t	2026-05-15 05:19:14.689213
416	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 05:19:14.65568	t	2026-05-15 05:34:14.646841
421	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 05:19:14.766525	t	2026-05-15 05:34:14.742289
422	2	11	screen_lock	high	Screen lock is not configured	2026-05-15 05:34:14.529238	t	2026-05-15 05:49:14.519789
423	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 05:34:14.529238	t	2026-05-15 05:49:14.519789
425	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 05:34:14.581547	t	2026-05-15 05:49:14.585141
426	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 05:34:14.581547	t	2026-05-15 05:49:14.585141
427	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-15 05:34:14.679195	t	2026-05-15 05:49:14.717842
428	4	13	os_update	high	OS version is below the required minimum	2026-05-15 05:34:14.742289	t	2026-05-15 05:49:14.804956
429	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 05:34:14.742289	t	2026-05-15 05:49:14.804956
430	2	11	os_update	high	OS version is below the required minimum	2026-05-15 05:49:14.519789	t	2026-05-15 06:04:14.517965
424	3	12	os_update	high	OS version is below the required minimum	2026-05-15 05:34:14.581547	t	2026-05-15 06:04:14.576412
431	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-15 05:49:14.585141	t	2026-05-15 06:04:14.576412
432	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 05:49:14.622742	t	2026-05-15 06:04:14.622868
433	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 05:49:14.622742	t	2026-05-15 06:04:14.622868
434	2	2	os_update	high	OS version is below the required minimum	2026-05-15 05:49:14.669529	t	2026-05-15 06:04:14.661369
435	1	10	os_update	high	OS version is below the required minimum	2026-05-15 05:49:14.753227	t	2026-05-15 06:04:14.764113
436	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 05:49:14.753227	t	2026-05-15 06:04:14.764113
440	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 06:04:14.576412	t	2026-05-15 06:19:14.587515
441	2	2	screen_lock	high	Screen lock is not configured	2026-05-15 06:04:14.661369	t	2026-05-15 06:19:14.649334
442	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 06:04:14.764113	t	2026-05-15 06:19:14.707688
437	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 05:49:14.804956	t	2026-05-15 06:19:14.751595
438	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 06:04:14.517965	t	2026-05-15 06:34:14.524859
445	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 06:19:14.532309	t	2026-05-15 06:34:14.524859
446	3	12	screen_lock	high	Screen lock is not configured	2026-05-15 06:19:14.587515	t	2026-05-15 06:34:14.573959
439	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 06:04:14.576412	t	2026-05-15 06:34:14.573959
447	1	1	os_update	high	OS version is below the required minimum	2026-05-15 06:19:14.61577	t	2026-05-15 06:34:14.623839
448	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 06:19:14.649334	t	2026-05-15 06:34:14.669798
449	3	3	os_update	high	OS version is below the required minimum	2026-05-15 06:19:14.682598	t	2026-05-15 06:34:14.712994
450	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-15 06:19:14.707688	t	2026-05-15 06:34:14.750792
451	4	13	screen_lock	high	Screen lock is not configured	2026-05-15 06:19:14.751595	t	2026-05-15 06:34:14.791671
453	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 06:19:14.751595	t	2026-05-15 06:34:14.791671
443	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 06:04:14.809999	t	2026-05-15 06:34:14.791671
455	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-15 06:34:14.623839	t	2026-05-15 06:49:14.514478
452	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-15 06:19:14.751595	t	2026-05-15 06:49:14.61746
444	2	11	os_update	high	OS version is below the required minimum	2026-05-15 06:19:14.532309	t	2026-05-15 06:49:14.649054
454	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 06:34:14.524859	t	2026-05-15 06:49:14.649054
456	1	1	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 06:49:14.514478	t	2026-05-15 07:04:14.547392
457	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 06:49:14.514478	t	2026-05-15 07:04:14.547392
458	3	3	os_update	high	OS version is below the required minimum	2026-05-15 06:49:14.570575	t	2026-05-15 07:04:14.62721
460	1	10	screen_lock	high	Screen lock is not configured	2026-05-15 06:49:14.602481	t	2026-05-15 07:04:14.647715
461	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 06:49:14.602481	t	2026-05-15 07:04:14.647715
462	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 06:49:14.649054	t	2026-05-15 07:04:14.710781
465	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 07:04:14.685336	t	2026-05-15 07:19:14.662421
466	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 07:04:14.685336	t	2026-05-15 07:19:14.662421
467	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 07:04:14.710781	t	2026-05-15 07:19:14.688698
468	3	12	os_update	high	OS version is below the required minimum	2026-05-15 07:04:14.734683	t	2026-05-15 07:19:14.712419
459	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-15 06:49:14.570575	t	2026-05-15 08:34:14.632439
463	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 07:04:14.62721	t	2026-05-15 07:19:14.602916
464	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 07:04:14.647715	t	2026-05-15 07:19:14.634138
469	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 07:04:14.734683	t	2026-05-15 07:19:14.712419
470	1	1	os_update	high	OS version is below the required minimum	2026-05-15 07:19:14.525569	t	2026-05-15 07:34:14.515282
471	2	2	os_update	high	OS version is below the required minimum	2026-05-15 07:19:14.568517	t	2026-05-15 07:34:14.565764
472	3	3	os_update	high	OS version is below the required minimum	2026-05-15 07:19:14.602916	t	2026-05-15 07:34:14.615882
473	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 07:19:14.634138	t	2026-05-15 07:34:14.67005
474	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 07:34:14.515282	t	2026-05-15 08:34:14.519559
475	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 07:34:14.515282	t	2026-05-15 08:34:14.519559
476	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 07:34:14.565764	t	2026-05-15 08:34:14.61022
477	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 07:34:14.615882	t	2026-05-15 08:34:14.632439
478	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 07:34:14.67005	t	2026-05-15 08:34:14.665301
479	4	13	os_update	high	OS version is below the required minimum	2026-05-15 07:34:14.70934	t	2026-05-15 08:34:14.689296
480	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-15 07:34:14.755028	t	2026-05-15 08:34:14.71174
482	3	12	os_update	high	OS version is below the required minimum	2026-05-15 07:34:14.800336	t	2026-05-15 08:34:14.743504
483	1	1	screen_lock	high	Screen lock is not configured	2026-05-15 08:34:14.519559	t	2026-05-15 08:49:14.524476
484	2	2	os_update	high	OS version is below the required minimum	2026-05-15 08:34:14.61022	t	2026-05-15 08:49:14.660971
485	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 08:34:14.61022	t	2026-05-15 08:49:14.660971
487	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 08:34:14.665301	t	2026-05-15 08:49:14.79389
488	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 08:34:14.689296	t	2026-05-15 08:49:14.862776
489	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 08:34:14.689296	t	2026-05-15 08:49:14.862776
481	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 07:34:14.755028	t	2026-05-15 08:49:15.03335
491	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 08:34:14.743504	t	2026-05-15 08:49:15.113421
492	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-15 08:49:14.524476	t	2026-05-15 09:04:14.530632
486	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-15 08:34:14.665301	t	2026-05-15 09:04:14.757458
494	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 08:49:14.79389	t	2026-05-15 09:04:14.757458
495	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-15 08:49:14.862776	t	2026-05-15 09:04:14.809843
496	2	11	os_update	high	OS version is below the required minimum	2026-05-15 08:49:15.03335	t	2026-05-15 09:04:14.98455
497	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 08:49:15.03335	t	2026-05-15 09:04:14.98455
490	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 08:34:14.743504	t	2026-05-15 09:04:15.153769
498	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 08:49:15.113421	t	2026-05-15 09:04:15.153769
505	3	12	os_update	high	OS version is below the required minimum	2026-05-15 09:04:15.153769	t	2026-05-15 09:19:14.528612
506	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-15 09:04:15.153769	t	2026-05-15 09:19:14.528612
507	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 09:04:15.153769	t	2026-05-15 09:19:14.528612
499	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 09:04:14.530632	t	2026-05-15 09:19:14.675882
493	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 08:49:14.728187	t	2026-05-15 09:19:14.911572
500	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 09:04:14.704155	t	2026-05-15 09:19:14.911572
501	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 09:04:14.757458	t	2026-05-15 09:19:15.123984
502	4	13	os_update	high	OS version is below the required minimum	2026-05-15 09:04:14.809843	t	2026-05-15 09:19:15.300616
503	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 09:04:14.809843	t	2026-05-15 09:19:15.300616
504	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 09:04:14.809843	t	2026-05-15 09:19:15.300616
508	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 09:19:14.528612	t	2026-05-15 09:34:14.522222
509	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 09:19:14.675882	t	2026-05-15 09:34:14.636159
510	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 09:19:14.743504	t	2026-05-15 09:34:14.677592
511	3	3	os_update	high	OS version is below the required minimum	2026-05-15 09:19:14.911572	t	2026-05-15 09:34:14.700514
512	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 09:19:14.911572	t	2026-05-15 09:34:14.700514
513	4	13	screen_lock	high	Screen lock is not configured	2026-05-15 09:19:15.300616	t	2026-05-15 09:34:14.76464
514	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-15 09:19:15.300616	t	2026-05-15 09:34:14.76464
515	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 09:19:15.372222	t	2026-05-15 09:34:14.780985
516	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 09:34:14.522222	t	2026-05-15 09:49:14.528212
517	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-15 09:34:14.522222	t	2026-05-15 09:49:14.528212
518	1	1	os_update	high	OS version is below the required minimum	2026-05-15 09:34:14.636159	t	2026-05-15 09:49:14.643565
519	2	2	screen_lock	high	Screen lock is not configured	2026-05-15 09:34:14.677592	t	2026-05-15 09:49:14.675173
520	2	2	os_update	high	OS version is below the required minimum	2026-05-15 09:34:14.677592	t	2026-05-15 09:49:14.675173
521	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 09:34:14.700514	t	2026-05-15 09:49:14.691147
522	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 09:34:14.700514	t	2026-05-15 09:49:14.691147
524	3	3	os_update	high	OS version is below the required minimum	2026-05-15 09:49:14.691147	t	2026-05-15 10:04:14.703347
525	1	10	os_update	high	OS version is below the required minimum	2026-05-15 09:49:14.725394	t	2026-05-15 10:04:14.752375
526	4	13	os_update	high	OS version is below the required minimum	2026-05-15 09:49:14.756203	t	2026-05-15 10:04:14.786797
527	2	11	os_update	high	OS version is below the required minimum	2026-05-15 09:49:14.786313	t	2026-05-15 10:04:14.834698
523	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 09:34:14.780985	t	2026-05-15 09:49:14.786313
528	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 09:49:14.786313	t	2026-05-15 10:04:14.834698
529	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 10:04:14.524185	t	2026-05-15 10:19:14.551835
530	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 10:04:14.619967	t	2026-05-15 10:19:14.667779
531	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 10:04:14.668705	t	2026-05-15 10:19:14.706837
532	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-15 10:04:14.786797	t	2026-05-15 10:19:14.809753
534	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-15 10:04:14.834698	t	2026-05-15 10:19:14.843063
536	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 10:19:14.667779	t	2026-05-15 10:34:14.620714
537	3	3	screen_lock	high	Screen lock is not configured	2026-05-15 10:19:14.740869	t	2026-05-15 10:34:14.685721
538	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 10:19:14.776532	t	2026-05-15 10:34:14.717973
533	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 10:04:14.786797	t	2026-05-15 10:34:14.747423
539	3	12	password_length	medium	Password is shorter than the required minimum	2026-05-15 10:34:14.526372	t	2026-05-15 11:04:14.544975
540	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 10:34:14.526372	t	2026-05-15 11:04:14.544975
535	1	1	screen_lock	high	Screen lock is not configured	2026-05-15 10:19:14.667779	t	2026-05-15 11:04:14.592193
541	1	10	os_update	high	OS version is below the required minimum	2026-05-15 10:34:14.717973	t	2026-05-15 11:04:14.68142
542	4	13	screen_lock	high	Screen lock is not configured	2026-05-15 10:34:14.747423	t	2026-05-15 11:04:14.708746
543	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-15 10:34:14.784837	t	2026-05-15 11:04:14.758329
545	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 11:04:14.592193	t	2026-05-15 11:19:14.578002
546	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:04:14.624241	t	2026-05-15 11:19:14.626096
547	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 11:04:14.654227	t	2026-05-15 11:19:14.67359
548	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:04:14.654227	t	2026-05-15 11:19:14.67359
549	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-15 11:04:14.68142	t	2026-05-15 11:19:14.724312
552	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 11:19:14.67359	t	2026-05-15 11:34:14.515963
553	1	10	os_update	high	OS version is below the required minimum	2026-05-15 11:19:14.724312	t	2026-05-15 11:34:14.550001
554	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 11:19:14.724312	t	2026-05-15 11:34:14.550001
555	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:19:14.724312	t	2026-05-15 11:34:14.550001
556	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:19:14.777897	t	2026-05-15 11:34:14.582228
557	2	11	os_update	high	OS version is below the required minimum	2026-05-15 11:19:14.821661	t	2026-05-15 11:34:14.61683
558	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:19:14.821661	t	2026-05-15 11:34:14.61683
544	3	12	os_update	high	OS version is below the required minimum	2026-05-15 11:04:14.544975	t	2026-05-15 11:34:14.648411
550	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:19:14.52818	t	2026-05-15 11:34:14.648411
551	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 11:19:14.626096	t	2026-05-15 11:34:14.681595
559	3	3	os_update	high	OS version is below the required minimum	2026-05-15 11:34:14.515963	t	2026-05-15 11:49:14.533053
560	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-15 11:34:14.61683	t	2026-05-15 11:49:14.64522
561	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 11:34:14.648411	t	2026-05-15 11:49:14.698045
562	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:34:14.664632	t	2026-05-15 11:49:14.732514
563	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 11:49:14.533053	t	2026-05-15 12:04:14.529738
564	1	10	os_update	high	OS version is below the required minimum	2026-05-15 11:49:14.578662	t	2026-05-15 12:04:14.58523
565	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 11:49:14.578662	t	2026-05-15 12:04:14.58523
567	2	11	os_update	high	OS version is below the required minimum	2026-05-15 11:49:14.64522	t	2026-05-15 12:04:14.668244
568	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 11:49:14.698045	t	2026-05-15 12:04:14.705347
571	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 12:04:14.529738	t	2026-05-15 12:19:14.52343
572	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-15 12:04:14.58523	t	2026-05-15 12:19:14.587996
566	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-15 11:49:14.62556	t	2026-05-15 12:19:14.623884
574	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 12:04:14.705347	t	2026-05-15 12:19:14.727532
569	1	1	os_update	high	OS version is below the required minimum	2026-05-15 11:49:14.732514	t	2026-05-15 12:19:14.77698
575	3	3	os_update	high	OS version is below the required minimum	2026-05-15 12:19:14.52343	t	2026-05-16 05:00:05.014727
576	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 12:19:14.52343	t	2026-05-16 05:00:05.014727
577	1	10	os_update	high	OS version is below the required minimum	2026-05-15 12:19:14.587996	t	2026-05-16 05:00:05.163274
573	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-15 12:04:14.58523	t	2026-05-16 05:00:05.163274
578	4	13	screen_lock	high	Screen lock is not configured	2026-05-15 12:19:14.623884	t	2026-05-16 05:00:05.211227
579	4	13	os_update	high	OS version is below the required minimum	2026-05-15 12:19:14.623884	t	2026-05-16 05:00:05.211227
581	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 12:19:14.676968	t	2026-05-16 05:00:05.274233
583	2	2	screen_lock	high	Screen lock is not configured	2026-05-15 12:19:14.840287	t	2026-05-16 05:00:05.510943
584	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 12:19:14.840287	t	2026-05-16 05:00:05.510943
585	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 05:00:05.014727	t	2026-05-16 05:15:04.951615
580	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-15 12:19:14.623884	t	2026-05-16 05:15:05.05505
587	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 05:00:05.350402	t	2026-05-16 05:15:05.131019
586	2	11	os_update	high	OS version is below the required minimum	2026-05-16 05:00:05.274233	t	2026-05-16 05:30:05.037454
582	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-15 12:19:14.77698	t	2026-05-16 05:00:05.416815
570	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-15 11:49:14.732514	t	2026-05-16 05:00:05.416815
588	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 05:00:05.350402	t	2026-05-16 05:15:05.131019
590	2	2	os_update	high	OS version is below the required minimum	2026-05-16 05:00:05.510943	t	2026-05-16 05:15:05.223424
591	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 05:00:05.510943	t	2026-05-16 05:15:05.223424
592	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 05:15:04.951615	t	2026-05-16 05:30:04.944112
593	1	10	os_update	high	OS version is below the required minimum	2026-05-16 05:15:05.003972	t	2026-05-16 05:30:04.980006
594	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 05:15:05.003972	t	2026-05-16 05:30:04.980006
595	2	11	screen_lock	high	Screen lock is not configured	2026-05-16 05:15:05.101079	t	2026-05-16 05:30:05.037454
596	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 05:15:05.101079	t	2026-05-16 05:30:05.037454
589	1	1	screen_lock	high	Screen lock is not configured	2026-05-16 05:00:05.416815	t	2026-05-16 05:30:05.097267
598	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 05:15:05.223424	t	2026-05-16 05:30:05.113397
597	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 05:15:05.223424	t	2026-05-16 05:45:04.951864
599	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 05:30:04.944112	t	2026-05-16 05:45:04.985769
600	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-16 05:30:05.009484	t	2026-05-16 05:45:05.042904
601	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 05:30:05.009484	t	2026-05-16 05:45:05.042904
602	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 05:30:05.009484	t	2026-05-16 05:45:05.042904
603	3	12	os_update	high	OS version is below the required minimum	2026-05-16 05:30:05.069974	t	2026-05-16 05:45:05.113341
604	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 05:30:05.069974	t	2026-05-16 05:45:05.113341
605	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 05:30:05.097267	t	2026-05-16 05:45:05.142365
608	3	3	screen_lock	high	Screen lock is not configured	2026-05-16 05:45:04.985769	t	2026-05-16 06:00:04.996509
609	1	10	os_update	high	OS version is below the required minimum	2026-05-16 05:45:05.006057	t	2026-05-16 06:00:05.033399
610	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 05:45:05.006057	t	2026-05-16 06:00:05.033399
611	2	11	os_update	high	OS version is below the required minimum	2026-05-16 05:45:05.082276	t	2026-05-16 06:00:05.100149
612	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 05:45:05.082276	t	2026-05-16 06:00:05.100149
613	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 05:45:05.113341	t	2026-05-16 06:00:05.137996
606	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 05:30:05.097267	t	2026-05-16 06:00:05.177783
607	2	2	os_update	high	OS version is below the required minimum	2026-05-16 05:30:05.113397	t	2026-05-16 06:15:04.947401
615	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-16 06:00:04.95561	t	2026-05-16 06:15:04.947401
616	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 06:00:04.95561	t	2026-05-16 06:15:04.947401
617	3	3	os_update	high	OS version is below the required minimum	2026-05-16 06:00:04.996509	t	2026-05-16 06:15:04.990789
618	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-16 06:00:05.033399	t	2026-05-16 06:15:05.026707
620	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 06:00:05.100149	t	2026-05-16 06:15:05.095012
621	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 06:00:05.100149	t	2026-05-16 06:15:05.095012
622	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 06:00:05.137996	t	2026-05-16 06:15:05.125644
614	1	1	os_update	high	OS version is below the required minimum	2026-05-16 05:45:05.142365	t	2026-05-16 06:15:05.155065
623	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 06:15:05.026707	t	2026-05-16 06:30:05.077454
624	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 06:15:05.026707	t	2026-05-16 06:30:05.077454
619	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 06:00:05.033399	t	2026-05-16 06:30:05.077454
625	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-16 06:15:05.095012	t	2026-05-16 06:30:05.168773
626	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 06:15:05.095012	t	2026-05-16 06:30:05.168773
627	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 06:15:05.095012	t	2026-05-16 06:30:05.168773
628	3	12	screen_lock	high	Screen lock is not configured	2026-05-16 06:15:05.125644	t	2026-05-16 06:30:05.204843
629	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 06:15:05.125644	t	2026-05-16 06:30:05.204843
630	3	3	os_update	high	OS version is below the required minimum	2026-05-16 06:30:05.021995	t	2026-05-16 06:45:04.999221
631	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-16 06:30:05.021995	t	2026-05-16 06:45:04.999221
632	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 06:30:05.242526	t	2026-05-16 06:45:05.189966
633	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 06:30:05.242526	t	2026-05-16 06:45:05.189966
635	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 06:45:05.038181	t	2026-05-16 07:00:05.033658
636	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 06:45:05.038181	t	2026-05-16 07:00:05.033658
637	4	13	os_update	high	OS version is below the required minimum	2026-05-16 06:45:05.089533	t	2026-05-16 07:00:05.073561
638	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 06:45:05.128123	t	2026-05-16 07:00:05.105962
639	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 06:45:05.154971	t	2026-05-16 07:00:05.137053
640	1	1	screen_lock	high	Screen lock is not configured	2026-05-16 06:45:05.189966	t	2026-05-16 07:00:05.170385
644	2	11	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 07:00:05.105962	t	2026-05-16 07:15:05.115127
647	2	2	os_update	high	OS version is below the required minimum	2026-05-16 07:15:04.951711	t	2026-05-16 08:30:04.947844
643	1	10	os_update	high	OS version is below the required minimum	2026-05-16 07:00:05.033658	t	2026-05-16 08:30:05.101702
645	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-16 07:00:05.105962	t	2026-05-16 08:30:05.23238
646	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 07:00:05.105962	t	2026-05-16 07:15:05.115127
660	4	13	os_update	high	OS version is below the required minimum	2026-05-16 08:30:05.154057	t	2026-05-16 08:48:24.930395
661	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 08:30:05.154057	t	2026-05-16 08:48:24.930395
656	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 08:30:04.947844	t	2026-05-16 08:48:25.14427
657	3	3	os_update	high	OS version is below the required minimum	2026-05-16 08:30:05.036116	t	2026-05-16 08:48:25.183353
659	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 08:30:05.101702	t	2026-05-16 08:48:25.224117
658	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 08:30:05.036116	t	2026-05-16 09:03:25.148351
641	3	3	os_update	high	OS version is below the required minimum	2026-05-16 07:00:04.995857	t	2026-05-16 07:15:05.000419
634	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 06:45:04.999221	t	2026-05-16 07:15:05.000419
642	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 07:00:04.995857	t	2026-05-16 07:15:05.000419
648	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 07:15:04.951711	t	2026-05-16 08:30:04.947844
649	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 07:15:05.033731	t	2026-05-16 08:30:05.101702
651	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 07:15:05.076873	t	2026-05-16 08:30:05.154057
652	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 07:15:05.115127	t	2026-05-16 08:30:05.23238
653	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 07:15:05.156413	t	2026-05-16 08:30:05.293628
654	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 07:15:05.185785	t	2026-05-16 08:30:05.354543
655	1	1	os_update	high	OS version is below the required minimum	2026-05-16 07:15:05.185785	t	2026-05-16 08:48:25.106818
663	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 08:48:25.061443	t	2026-05-16 09:03:25.02752
664	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 08:48:25.061443	t	2026-05-16 09:03:25.02752
665	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 08:48:25.106818	t	2026-05-16 09:03:25.061091
666	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 08:48:25.14427	t	2026-05-16 09:03:25.112911
667	3	3	screen_lock	high	Screen lock is not configured	2026-05-16 08:48:25.183353	t	2026-05-16 09:03:25.148351
668	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 08:48:25.183353	t	2026-05-16 09:03:25.148351
650	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 07:15:05.033731	t	2026-05-16 09:03:25.193316
669	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 09:03:24.972798	t	2026-05-16 09:18:24.950458
670	2	2	screen_lock	high	Screen lock is not configured	2026-05-16 09:03:25.112911	t	2026-05-16 09:18:25.047424
671	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 09:03:25.112911	t	2026-05-16 09:18:25.047424
672	3	3	os_update	high	OS version is below the required minimum	2026-05-16 09:03:25.148351	t	2026-05-16 09:18:25.070413
673	2	11	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 09:18:24.950458	t	2026-05-16 09:33:24.982579
662	3	12	os_update	high	OS version is below the required minimum	2026-05-16 08:48:25.061443	t	2026-05-16 09:33:25.039038
674	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 09:18:24.985063	t	2026-05-16 09:33:25.039038
676	4	13	os_update	high	OS version is below the required minimum	2026-05-16 09:33:24.91654	t	2026-05-16 09:48:24.91544
677	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 09:33:24.91654	t	2026-05-16 09:48:24.91544
678	2	11	os_update	high	OS version is below the required minimum	2026-05-16 09:33:24.982579	t	2026-05-16 09:48:24.979102
679	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-16 09:33:24.982579	t	2026-05-16 09:48:24.979102
680	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 09:33:25.039038	t	2026-05-16 09:48:25.014679
675	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 09:18:24.985063	t	2026-05-16 09:48:25.014679
681	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 09:33:25.119001	t	2026-05-16 09:48:25.075078
683	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 09:33:25.194093	t	2026-05-16 09:48:25.128628
684	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 09:33:25.194093	t	2026-05-16 09:48:25.128628
685	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 09:33:25.194093	t	2026-05-16 09:48:25.128628
686	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 09:48:24.979102	t	2026-05-16 10:03:24.949214
687	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 09:48:25.014679	t	2026-05-16 10:03:24.995541
688	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 09:48:25.042915	t	2026-05-16 10:03:25.0467
689	2	2	os_update	high	OS version is below the required minimum	2026-05-16 09:48:25.075078	t	2026-05-16 10:03:25.080688
682	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 09:33:25.159125	t	2026-05-16 10:03:25.115298
691	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 10:03:24.949214	t	2026-05-16 10:18:24.990086
692	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 10:03:24.995541	t	2026-05-16 10:18:25.034371
693	3	3	os_update	high	OS version is below the required minimum	2026-05-16 10:03:25.115298	t	2026-05-16 10:18:25.156262
694	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 10:03:25.115298	t	2026-05-16 10:18:25.156262
695	1	10	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 10:03:25.152377	t	2026-05-16 10:18:25.187702
696	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-16 10:03:25.152377	t	2026-05-16 10:18:25.187702
697	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 10:03:25.152377	t	2026-05-16 10:18:25.187702
690	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 10:03:24.910787	t	2026-05-16 10:33:24.911576
698	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 10:18:24.925757	t	2026-05-16 10:33:24.911576
699	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 10:18:24.925757	t	2026-05-16 10:33:24.911576
701	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-16 10:18:25.075677	t	2026-05-16 10:33:24.988824
702	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 10:18:25.156262	t	2026-05-16 10:33:25.036836
704	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 10:18:25.187702	t	2026-05-16 10:33:25.068686
700	3	12	os_update	high	OS version is below the required minimum	2026-05-16 10:18:25.034371	t	2026-05-16 10:48:25.014409
707	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-16 10:33:25.020668	t	2026-05-16 10:48:25.078186
708	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 10:33:25.020668	t	2026-05-16 10:48:25.078186
710	3	3	os_update	high	OS version is below the required minimum	2026-05-16 10:33:25.036836	t	2026-05-16 10:48:25.100998
709	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 10:33:25.020668	t	2026-05-16 11:03:25.046865
703	1	10	os_update	high	OS version is below the required minimum	2026-05-16 10:18:25.187702	t	2026-05-16 11:03:25.099544
711	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 10:48:24.920634	t	2026-05-16 11:18:24.919227
712	4	13	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 10:48:24.920634	t	2026-05-16 11:03:24.904534
715	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-16 10:48:25.048332	t	2026-05-16 11:03:25.007487
716	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 10:48:25.048332	t	2026-05-16 11:03:25.007487
717	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 10:48:25.131048	t	2026-05-16 11:03:25.099544
719	3	12	os_update	high	OS version is below the required minimum	2026-05-16 11:03:24.98333	t	2026-05-16 11:18:24.979079
721	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 11:03:24.98333	t	2026-05-16 11:18:24.979079
720	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 11:03:24.98333	t	2026-05-16 11:33:24.967906
723	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 11:18:25.057827	t	2026-05-16 11:33:25.046656
727	1	1	screen_lock	high	Screen lock is not configured	2026-05-16 11:33:24.996285	t	2026-05-16 11:48:25.027856
730	1	10	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 11:33:25.075529	t	2026-05-16 11:48:25.13803
736	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-16 11:48:24.954027	t	2026-05-16 12:03:24.957262
737	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 11:48:24.954027	t	2026-05-16 12:03:24.957262
731	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 11:33:25.075529	t	2026-05-16 12:03:25.13412
732	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 11:33:25.075529	t	2026-05-16 12:03:25.13412
740	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-16 12:03:24.912399	t	2026-05-16 12:18:24.910072
741	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 12:03:25.031391	t	2026-05-16 12:18:25.108243
744	1	10	os_update	high	OS version is below the required minimum	2026-05-16 12:03:25.13412	t	2026-05-16 12:18:25.223729
752	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 12:18:25.189577	t	2026-05-18 05:38:10.681716
747	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 12:18:25.050597	t	2026-05-18 05:38:10.881429
705	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 10:33:24.947884	t	2026-05-16 10:48:24.982872
722	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 11:03:25.099544	t	2026-05-16 11:33:25.075529
724	4	13	os_update	high	OS version is below the required minimum	2026-05-16 11:33:24.91395	t	2026-05-16 11:48:24.904848
728	3	3	os_update	high	OS version is below the required minimum	2026-05-16 11:33:25.046656	t	2026-05-16 11:48:25.107866
729	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 11:33:25.046656	t	2026-05-16 11:48:25.107866
725	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 11:33:24.91395	t	2026-05-16 12:03:24.912399
742	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-16 12:03:25.062351	t	2026-05-16 12:18:25.15433
750	2	2	screen_lock	high	Screen lock is not configured	2026-05-16 12:18:25.15433	t	2026-05-18 05:38:10.640467
751	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 12:18:25.15433	t	2026-05-18 05:38:10.640467
739	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 11:48:25.107866	t	2026-05-18 05:38:10.681716
706	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 10:33:24.980629	t	2026-05-16 10:48:25.014409
713	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 10:48:25.014409	t	2026-05-16 11:03:24.98333
714	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-16 10:48:25.014409	t	2026-05-16 11:03:24.98333
718	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 11:03:24.904534	t	2026-05-16 11:18:24.919227
733	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 11:48:24.904848	t	2026-05-16 12:03:24.912399
734	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-16 11:48:24.904848	t	2026-05-16 12:03:24.912399
735	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 11:48:24.904848	t	2026-05-16 12:03:24.912399
726	2	11	os_update	high	OS version is below the required minimum	2026-05-16 11:33:24.944136	t	2026-05-16 12:03:24.957262
738	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 11:48:25.027856	t	2026-05-16 12:03:25.031391
743	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-16 12:03:25.099482	t	2026-05-16 12:18:25.189577
748	1	1	screen_lock	high	Screen lock is not configured	2026-05-16 12:18:25.108243	t	2026-05-18 05:38:10.545932
749	1	1	os_update	high	OS version is below the required minimum	2026-05-16 12:18:25.108243	t	2026-05-18 05:38:10.545932
753	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-16 12:18:25.223729	t	2026-05-18 05:38:10.730209
745	4	13	encryption	critical	Device encryption is disabled — data at risk	2026-05-16 12:18:24.910072	t	2026-05-18 05:38:10.777958
746	4	13	os_update	high	OS version is below the required minimum	2026-05-16 12:18:24.910072	t	2026-05-18 05:38:10.777958
758	6	14	screen_lock_missing	high	Screen lock / PIN is not configured on the device	2026-05-18 05:39:23.586927	f	\N
759	6	14	password_too_short	medium	Device password does not meet minimum length requirement	2026-05-18 05:39:23.586927	f	\N
760	6	14	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-18 05:39:23.586927	f	\N
761	6	14	usb_enabled	medium	USB access is enabled but policy requires it disabled	2026-05-18 05:39:23.586927	f	\N
762	6	19	password_too_short	medium	Device password does not meet minimum length requirement	2026-05-18 05:39:23.702896	f	\N
763	6	19	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-18 05:39:23.702896	f	\N
764	6	19	usb_enabled	medium	USB access is enabled but policy requires it disabled	2026-05-18 05:39:23.702896	f	\N
765	7	20	usb_enabled	medium	USB access is enabled but policy requires it disabled	2026-05-18 05:39:23.729724	f	\N
766	8	21	encryption_disabled	critical	Device storage encryption is not enabled	2026-05-18 05:39:23.750208	f	\N
767	8	21	os_not_updated	high	Device OS version is below the required minimum	2026-05-18 05:39:23.750208	f	\N
768	4	22	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-18 05:39:23.778534	f	\N
769	5	23	os_not_updated	high	Device OS version is below the required minimum	2026-05-18 05:39:23.803177	f	\N
770	7	26	encryption_disabled	critical	Device storage encryption is not enabled	2026-05-18 05:39:23.885511	f	\N
771	7	26	screen_lock_missing	high	Screen lock / PIN is not configured on the device	2026-05-18 05:39:23.885511	f	\N
772	7	26	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-18 05:39:23.885511	f	\N
773	7	26	usb_enabled	medium	USB access is enabled but policy requires it disabled	2026-05-18 05:39:23.885511	f	\N
774	4	28	usb_enabled	medium	USB access is enabled but policy requires it disabled	2026-05-18 05:39:23.953698	f	\N
775	6	30	os_not_updated	high	Device OS version is below the required minimum	2026-05-18 05:39:24.003348	f	\N
776	8	32	encryption_disabled	critical	Device storage encryption is not enabled	2026-05-18 05:39:24.046322	f	\N
777	8	32	os_not_updated	high	Device OS version is below the required minimum	2026-05-18 05:39:24.046322	f	\N
778	1	33	encryption_disabled	critical	Device storage encryption is not enabled	2026-05-18 05:39:24.077833	f	\N
779	1	33	os_not_updated	high	Device OS version is below the required minimum	2026-05-18 05:39:24.077833	f	\N
780	2	34	os_not_updated	high	Device OS version is below the required minimum	2026-05-18 05:39:24.112731	f	\N
781	2	34	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-18 05:39:24.112731	f	\N
782	4	36	encryption_disabled	critical	Device storage encryption is not enabled	2026-05-18 05:39:24.166525	f	\N
783	4	36	password_too_short	medium	Device password does not meet minimum length requirement	2026-05-18 05:39:24.166525	f	\N
784	4	36	bluetooth_enabled	medium	Bluetooth is enabled but policy requires it disabled	2026-05-18 05:39:24.166525	f	\N
754	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:38:10.777958	t	2026-05-18 05:53:10.737237
756	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:38:10.881429	t	2026-05-18 05:53:10.795633
757	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 05:38:10.881429	t	2026-05-18 05:53:10.795633
795	7	15	os_update	high	OS version is below the required minimum	2026-05-18 05:53:10.897272	t	2026-05-18 06:08:10.572728
785	1	1	os_update	high	OS version is below the required minimum	2026-05-18 05:53:10.534139	t	2026-05-18 06:08:11.019491
786	2	2	os_update	high	OS version is below the required minimum	2026-05-18 05:53:10.600174	t	2026-05-18 06:08:11.055823
787	3	3	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 05:53:10.652546	t	2026-05-18 06:08:11.09041
788	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-18 05:53:10.70207	t	2026-05-18 06:08:11.123288
789	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 05:53:10.70207	t	2026-05-18 06:08:11.123288
790	1	10	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 05:53:10.70207	t	2026-05-18 06:08:11.123288
755	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 05:38:10.777958	t	2026-05-18 06:08:11.158843
792	3	12	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 05:53:10.795633	t	2026-05-18 06:08:11.225934
793	6	30	password_expiry	low	Password has not been changed within the required period	2026-05-18 05:53:10.830176	t	2026-05-18 06:08:11.257578
791	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:53:10.767573	t	2026-05-18 06:23:11.164546
798	11	18	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 05:53:10.935071	t	2026-05-18 06:08:10.604639
801	8	32	password_length	medium	Password is shorter than the required minimum	2026-05-18 05:53:11.048597	t	2026-05-18 06:08:10.706331
809	6	25	password_length	medium	Password is shorter than the required minimum	2026-05-18 05:53:11.265483	t	2026-05-18 06:08:10.858229
815	4	36	os_update	high	OS version is below the required minimum	2026-05-18 05:53:11.363375	t	2026-05-18 06:08:10.953554
816	4	36	password_length	medium	Password is shorter than the required minimum	2026-05-18 05:53:11.363375	t	2026-05-18 06:08:10.953554
817	4	36	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:53:11.363375	t	2026-05-18 06:08:10.953554
819	4	28	screen_lock	high	Screen lock is not configured	2026-05-18 05:53:11.465406	t	2026-05-18 06:08:11.317585
829	8	32	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:08:10.706331	t	2026-05-18 06:23:10.597629
833	5	23	os_update	high	OS version is below the required minimum	2026-05-18 06:08:10.781126	t	2026-05-18 06:23:10.739419
839	4	36	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:08:10.953554	t	2026-05-18 06:23:10.951975
840	4	36	password_expiry	low	Password has not been changed within the required period	2026-05-18 06:08:10.953554	t	2026-05-18 06:23:10.951975
845	2	2	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:08:11.055823	t	2026-05-18 06:23:11.051918
848	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:08:11.158843	t	2026-05-18 06:23:11.139035
854	6	30	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:08:11.257578	t	2026-05-18 06:23:11.218537
855	6	30	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:11.257578	t	2026-05-18 06:23:11.218537
837	6	25	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:08:10.858229	t	2026-05-18 06:38:11.14774
796	7	15	password_length	medium	Password is shorter than the required minimum	2026-05-18 05:53:10.897272	t	2026-05-18 06:08:10.572728
797	7	15	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:53:10.897272	t	2026-05-18 06:08:10.572728
799	6	19	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 05:53:10.971239	t	2026-05-18 06:08:10.645813
802	8	21	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 05:53:11.089362	t	2026-05-18 06:08:10.73288
805	1	33	screen_lock	high	Screen lock is not configured	2026-05-18 05:53:11.186086	t	2026-05-18 06:08:10.810749
806	1	33	os_update	high	OS version is below the required minimum	2026-05-18 05:53:11.186086	t	2026-05-18 06:08:10.810749
807	1	33	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:53:11.186086	t	2026-05-18 06:08:10.810749
810	2	34	password_expiry	low	Password has not been changed within the required period	2026-05-18 05:53:11.296295	t	2026-05-18 06:08:10.889983
811	2	34	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 05:53:11.296295	t	2026-05-18 06:08:10.889983
818	7	26	os_update	high	OS version is below the required minimum	2026-05-18 05:53:11.397379	t	2026-05-18 06:08:10.98658
820	5	37	password_length	medium	Password is shorter than the required minimum	2026-05-18 05:53:11.4969	t	2026-05-18 06:08:11.34365
827	7	20	os_update	high	OS version is below the required minimum	2026-05-18 06:08:10.680138	t	2026-05-18 06:23:10.562139
828	7	20	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:08:10.680138	t	2026-05-18 06:23:10.562139
803	8	21	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 05:53:11.089362	t	2026-05-18 06:23:10.68911
836	11	24	os_update	high	OS version is below the required minimum	2026-05-18 06:08:10.842586	t	2026-05-18 06:23:10.80214
844	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:11.019491	t	2026-05-18 06:23:11.02446
847	1	10	screen_lock	high	Screen lock is not configured	2026-05-18 06:08:11.123288	t	2026-05-18 06:23:11.109539
852	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:11.225934	t	2026-05-18 06:23:11.185425
853	3	12	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:08:11.225934	t	2026-05-18 06:23:11.185425
851	3	12	os_update	high	OS version is below the required minimum	2026-05-18 06:08:11.225934	t	2026-05-18 06:38:10.535511
794	6	14	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 05:53:10.868566	t	2026-05-18 06:08:10.527294
800	7	20	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 05:53:11.007519	t	2026-05-18 06:08:10.680138
804	4	22	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 05:53:11.123425	t	2026-05-18 06:08:10.747209
808	11	24	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:53:11.226694	t	2026-05-18 06:08:10.842586
812	3	35	os_update	high	OS version is below the required minimum	2026-05-18 05:53:11.330195	t	2026-05-18 06:08:10.925493
813	3	35	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 05:53:11.330195	t	2026-05-18 06:08:10.925493
814	3	35	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 05:53:11.330195	t	2026-05-18 06:08:10.925493
821	11	38	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 05:53:11.53167	t	2026-05-18 06:08:11.368915
822	11	38	password_expiry	low	Password has not been changed within the required period	2026-05-18 05:53:11.53167	t	2026-05-18 06:08:11.368915
858	11	38	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:08:11.368915	t	2026-05-18 06:23:10.657113
859	11	38	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:11.368915	t	2026-05-18 06:23:10.657113
860	11	38	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:08:11.368915	t	2026-05-18 06:23:10.657113
830	8	21	os_update	high	OS version is below the required minimum	2026-05-18 06:08:10.73288	t	2026-05-18 06:23:10.68911
831	8	21	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:08:10.73288	t	2026-05-18 06:23:10.68911
835	1	33	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:08:10.810749	t	2026-05-18 06:23:10.770734
838	2	34	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:08:10.889983	t	2026-05-18 06:23:10.86861
842	7	26	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:08:10.98658	t	2026-05-18 06:23:10.989478
843	7	26	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:10.98658	t	2026-05-18 06:23:10.989478
846	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:11.09041	t	2026-05-18 06:23:11.08526
849	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:08:11.194092	t	2026-05-18 06:23:11.164546
857	8	27	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:08:11.288764	t	2026-05-18 06:23:11.251973
823	6	14	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:08:10.527294	t	2026-05-18 06:23:11.310085
824	6	14	os_update	high	OS version is below the required minimum	2026-05-18 06:08:10.527294	t	2026-05-18 06:23:11.310085
825	6	14	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:08:10.527294	t	2026-05-18 06:23:11.310085
885	8	27	os_update	high	OS version is below the required minimum	2026-05-18 06:23:11.251973	t	2026-05-18 06:38:10.597989
886	4	28	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:23:11.285946	t	2026-05-18 06:38:10.636402
862	7	20	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:23:10.562139	t	2026-05-18 06:38:10.731345
863	8	32	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:23:10.597629	t	2026-05-18 06:38:10.765206
864	8	32	password_expiry	low	Password has not been changed within the required period	2026-05-18 06:23:10.597629	t	2026-05-18 06:38:10.765206
866	5	37	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:23:10.619055	t	2026-05-18 06:38:10.807461
867	5	37	password_expiry	low	Password has not been changed within the required period	2026-05-18 06:23:10.619055	t	2026-05-18 06:38:10.807461
889	11	18	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:23:11.370473	t	2026-05-18 06:38:10.884355
890	11	18	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:23:11.370473	t	2026-05-18 06:38:10.884355
832	8	21	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:10.73288	t	2026-05-18 06:38:10.976925
869	4	22	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:23:10.718043	t	2026-05-18 06:38:11.012927
871	4	22	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:23:10.718043	t	2026-05-18 06:38:11.012927
834	1	33	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:08:10.810749	t	2026-05-18 06:38:11.084684
873	1	33	password_expiry	low	Password has not been changed within the required period	2026-05-18 06:23:10.770734	t	2026-05-18 06:38:11.084684
874	6	25	screen_lock	high	Screen lock is not configured	2026-05-18 06:23:10.835344	t	2026-05-18 06:38:11.14774
877	3	35	password_expiry	low	Password has not been changed within the required period	2026-05-18 06:23:10.908959	t	2026-05-18 06:38:11.214403
878	4	36	os_update	high	OS version is below the required minimum	2026-05-18 06:23:10.951975	t	2026-05-18 06:38:11.249701
841	7	26	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:08:10.98658	t	2026-05-18 06:38:11.281232
879	7	26	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:23:10.989478	t	2026-05-18 06:38:11.281232
880	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:23:11.051918	t	2026-05-18 06:38:11.336958
881	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:23:11.051918	t	2026-05-18 06:38:11.336958
882	1	10	os_update	high	OS version is below the required minimum	2026-05-18 06:23:11.109539	t	2026-05-18 06:38:11.428223
883	4	13	os_update	high	OS version is below the required minimum	2026-05-18 06:23:11.139035	t	2026-05-18 06:38:11.472902
875	3	35	os_update	high	OS version is below the required minimum	2026-05-18 06:23:10.908959	t	2026-05-18 06:53:10.736699
876	3	35	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:23:10.908959	t	2026-05-18 06:53:10.736699
892	4	28	os_update	high	OS version is below the required minimum	2026-05-18 06:38:10.636402	t	2026-05-18 06:53:11.098029
861	6	19	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:23:10.523576	t	2026-05-18 06:53:11.157831
826	6	19	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:08:10.645813	t	2026-05-18 06:53:11.157831
850	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:08:11.194092	t	2026-05-18 06:53:11.18884
865	8	32	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:23:10.597629	t	2026-05-18 06:53:11.259698
870	4	22	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:23:10.718043	t	2026-05-18 06:53:11.476789
888	7	15	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:23:11.347081	t	2026-05-18 07:08:11.127015
872	5	23	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:23:10.739419	t	2026-05-18 07:08:11.538676
884	6	30	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:23:11.218537	t	2026-05-18 06:38:10.564443
902	11	24	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:38:11.121719	t	2026-05-18 06:53:10.621302
906	3	35	screen_lock	high	Screen lock is not configured	2026-05-18 06:38:11.214403	t	2026-05-18 06:53:10.736699
907	3	35	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:38:11.214403	t	2026-05-18 06:53:10.736699
910	1	1	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:38:11.302068	t	2026-05-18 06:53:10.85568
913	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:38:11.428223	t	2026-05-18 06:53:10.943539
893	6	14	os_update	high	OS version is below the required minimum	2026-05-18 06:38:10.668761	t	2026-05-18 06:53:11.127295
898	11	18	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:38:10.884355	t	2026-05-18 06:53:11.383289
929	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:53:10.960772	t	2026-05-18 07:08:10.530785
934	6	19	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:53:11.157831	t	2026-05-18 07:08:10.815745
916	1	33	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:53:10.550774	t	2026-05-18 07:08:11.032815
918	6	25	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:53:10.666112	t	2026-05-18 07:08:11.158828
920	4	36	os_update	high	OS version is below the required minimum	2026-05-18 06:53:10.7803	t	2026-05-18 07:08:11.396292
921	4	36	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:53:10.7803	t	2026-05-18 07:08:11.396292
922	4	36	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:53:10.7803	t	2026-05-18 07:08:11.396292
935	4	22	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:53:11.476789	t	2026-05-18 07:08:11.506981
911	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:38:11.302068	t	2026-05-18 07:08:11.618665
925	2	2	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:53:10.88674	t	2026-05-18 07:08:11.652801
908	3	35	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:38:11.214403	t	2026-05-18 07:23:10.874226
909	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:38:11.302068	t	2026-05-18 07:23:11.099622
856	8	27	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:08:11.288764	t	2026-05-18 06:38:10.597989
868	5	37	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:23:10.619055	t	2026-05-18 06:38:10.807461
903	6	25	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:38:11.14774	t	2026-05-18 06:53:10.666112
912	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:38:11.336958	t	2026-05-18 06:53:10.88674
914	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:38:11.472902	t	2026-05-18 06:53:11.033237
891	8	27	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:38:10.597989	t	2026-05-18 06:53:11.062651
896	5	37	screen_lock	high	Screen lock is not configured	2026-05-18 06:38:10.807461	t	2026-05-18 06:53:11.306196
897	5	37	os_update	high	OS version is below the required minimum	2026-05-18 06:38:10.807461	t	2026-05-18 06:53:11.306196
900	11	38	password_length	medium	Password is shorter than the required minimum	2026-05-18 06:38:10.931128	t	2026-05-18 06:53:11.417294
930	6	30	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:53:10.997854	t	2026-05-18 07:08:10.587201
931	6	30	password_expiry	low	Password has not been changed within the required period	2026-05-18 06:53:10.997854	t	2026-05-18 07:08:10.587201
932	6	30	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:53:10.997854	t	2026-05-18 07:08:10.587201
933	4	28	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:53:11.098029	t	2026-05-18 07:08:10.718341
894	6	19	os_update	high	OS version is below the required minimum	2026-05-18 06:38:10.70014	t	2026-05-18 07:08:10.815745
917	11	24	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:53:10.621302	t	2026-05-18 07:08:11.079867
899	11	38	os_update	high	OS version is below the required minimum	2026-05-18 06:38:10.931128	t	2026-05-18 07:08:11.365178
936	5	23	os_update	high	OS version is below the required minimum	2026-05-18 06:53:11.498269	t	2026-05-18 07:08:11.538676
937	5	23	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:53:11.498269	t	2026-05-18 07:08:11.538676
926	3	3	screen_lock	high	Screen lock is not configured	2026-05-18 06:53:10.913112	t	2026-05-18 07:08:11.698308
927	3	3	os_update	high	OS version is below the required minimum	2026-05-18 06:53:10.913112	t	2026-05-18 07:08:11.698308
887	4	28	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 06:23:11.285946	t	2026-05-18 06:38:10.636402
904	2	34	os_update	high	OS version is below the required minimum	2026-05-18 06:38:11.180335	t	2026-05-18 06:53:10.699628
905	2	34	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:38:11.180335	t	2026-05-18 06:53:10.699628
895	7	20	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:38:10.731345	t	2026-05-18 06:53:11.227634
901	8	21	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:38:10.976925	t	2026-05-18 06:53:11.448132
915	2	11	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 06:38:11.520011	t	2026-05-18 07:08:10.859724
919	3	35	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:53:10.736699	t	2026-05-18 07:08:11.311382
923	1	1	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 06:53:10.85568	t	2026-05-18 07:08:11.618665
924	1	1	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 06:53:10.85568	t	2026-05-18 07:08:11.618665
928	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 06:53:10.943539	t	2026-05-18 07:08:11.730029
941	6	14	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:08:10.774571	t	2026-05-18 07:23:10.521585
942	6	14	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:08:10.774571	t	2026-05-18 07:23:10.521585
943	6	19	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:08:10.815745	t	2026-05-18 07:23:10.560894
944	6	19	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 07:08:10.815745	t	2026-05-18 07:23:10.560894
945	6	19	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 07:08:10.815745	t	2026-05-18 07:23:10.560894
947	2	11	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:08:10.859724	t	2026-05-18 07:23:10.599091
948	7	20	os_update	high	OS version is below the required minimum	2026-05-18 07:08:10.903805	t	2026-05-18 07:23:10.631373
949	8	32	password_expiry	low	Password has not been changed within the required period	2026-05-18 07:08:10.953785	t	2026-05-18 07:23:10.655026
950	5	37	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:08:10.985355	t	2026-05-18 07:23:10.682299
951	5	37	password_expiry	low	Password has not been changed within the required period	2026-05-18 07:08:10.985355	t	2026-05-18 07:23:10.682299
953	1	33	os_update	high	OS version is below the required minimum	2026-05-18 07:08:11.032815	t	2026-05-18 07:23:10.701093
954	1	33	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:08:11.032815	t	2026-05-18 07:23:10.701093
955	11	24	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:08:11.079867	t	2026-05-18 07:23:10.733337
956	11	24	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:08:11.079867	t	2026-05-18 07:23:10.733337
957	11	18	screen_lock	high	Screen lock is not configured	2026-05-18 07:08:11.190683	t	2026-05-18 07:23:10.811208
958	11	18	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:08:11.190683	t	2026-05-18 07:23:10.811208
959	2	34	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 07:08:11.250693	t	2026-05-18 07:23:10.831304
960	2	34	os_update	high	OS version is below the required minimum	2026-05-18 07:08:11.250693	t	2026-05-18 07:23:10.831304
961	2	34	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:08:11.250693	t	2026-05-18 07:23:10.831304
962	2	34	password_expiry	low	Password has not been changed within the required period	2026-05-18 07:08:11.250693	t	2026-05-18 07:23:10.831304
963	2	34	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 07:08:11.250693	t	2026-05-18 07:23:10.831304
964	3	35	password_expiry	low	Password has not been changed within the required period	2026-05-18 07:08:11.311382	t	2026-05-18 07:23:10.874226
965	11	38	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:08:11.365178	t	2026-05-18 07:23:10.909419
966	4	36	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 07:08:11.396292	t	2026-05-18 07:23:10.940529
967	4	36	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:08:11.396292	t	2026-05-18 07:23:10.940529
968	8	21	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 07:08:11.443519	t	2026-05-18 07:23:10.975601
969	8	21	os_update	high	OS version is below the required minimum	2026-05-18 07:08:11.443519	t	2026-05-18 07:23:10.975601
971	7	26	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 07:08:11.58028	t	2026-05-18 07:23:11.071819
938	6	30	screen_lock	high	Screen lock is not configured	2026-05-18 07:08:10.587201	t	2026-05-18 07:23:11.171879
940	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:08:10.636785	t	2026-05-18 07:23:11.197781
974	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:08:11.698308	t	2026-05-18 07:23:11.264066
975	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 07:08:11.698308	t	2026-05-18 07:23:11.264066
946	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:08:10.859724	t	2026-05-18 08:23:10.850132
976	7	20	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:23:10.631373	t	2026-05-18 08:23:10.887693
977	5	37	os_update	high	OS version is below the required minimum	2026-05-18 07:23:10.682299	t	2026-05-18 08:23:10.985383
978	1	33	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 07:23:10.701093	t	2026-05-18 08:23:11.030602
979	7	15	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:23:10.747913	t	2026-05-18 08:23:11.107499
980	7	15	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:23:10.747913	t	2026-05-18 08:23:11.107499
982	6	25	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:23:10.779578	t	2026-05-18 08:23:11.148285
983	3	35	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 07:23:10.874226	t	2026-05-18 08:23:11.283995
984	3	35	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:23:10.874226	t	2026-05-18 08:23:11.283995
970	4	22	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 07:08:11.506981	t	2026-05-18 08:23:11.465732
987	4	22	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 07:23:11.008007	t	2026-05-18 08:23:11.465732
989	1	1	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 07:23:11.099622	t	2026-05-18 08:23:11.594316
973	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:08:11.652801	t	2026-05-18 08:23:11.641833
952	5	37	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 07:08:10.985355	t	2026-05-18 08:38:11.243939
972	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 07:08:11.652801	t	2026-05-18 07:23:11.119373
993	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:23:11.197781	t	2026-05-18 08:23:10.537644
997	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:23:11.264066	t	2026-05-18 08:23:10.686137
990	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:23:11.119373	t	2026-05-18 08:23:11.641833
985	4	36	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:23:10.940529	t	2026-05-18 08:38:10.565929
1022	7	26	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:23:11.549946	t	2026-05-18 08:38:10.678892
1023	7	26	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 08:23:11.549946	t	2026-05-18 08:38:10.678892
1026	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:11.690616	t	2026-05-18 08:38:10.781831
1002	8	27	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 08:23:10.589836	t	2026-05-18 08:38:10.879158
1003	4	28	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 08:23:10.648307	t	2026-05-18 08:38:10.912476
1004	7	20	os_update	high	OS version is below the required minimum	2026-05-18 08:23:10.887693	t	2026-05-18 08:38:11.161672
1005	7	20	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:23:10.887693	t	2026-05-18 08:38:11.161672
1006	7	20	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:10.887693	t	2026-05-18 08:38:11.161672
1016	3	35	os_update	high	OS version is below the required minimum	2026-05-18 08:23:11.283995	t	2026-05-18 08:38:11.597697
1001	8	27	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 08:23:10.589836	t	2026-05-18 08:53:11.585266
994	8	27	screen_lock	high	Screen lock is not configured	2026-05-18 07:23:11.217977	t	2026-05-18 08:23:10.589836
998	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:23:11.298954	t	2026-05-18 08:23:10.729789
986	8	21	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:23:10.975601	t	2026-05-18 08:23:11.423777
988	7	26	os_update	high	OS version is below the required minimum	2026-05-18 07:23:11.071819	t	2026-05-18 08:23:11.549946
991	3	12	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 07:23:11.134983	t	2026-05-18 08:23:11.690616
1024	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:11.594316	t	2026-05-18 08:38:10.707724
999	4	13	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:23:10.537644	t	2026-05-18 08:38:10.840488
1000	4	13	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:10.537644	t	2026-05-18 08:38:10.840488
1007	8	32	os_update	high	OS version is below the required minimum	2026-05-18 08:23:10.937384	t	2026-05-18 08:38:11.197241
1010	11	24	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:11.071218	t	2026-05-18 08:38:11.333619
1013	11	18	os_update	high	OS version is below the required minimum	2026-05-18 08:23:11.185901	t	2026-05-18 08:38:11.476567
1009	11	24	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:23:11.071218	t	2026-05-18 08:53:10.922819
1017	11	38	password_expiry	low	Password has not been changed within the required period	2026-05-18 08:23:11.318132	t	2026-05-18 08:53:11.00195
939	6	30	password_length	medium	Password is shorter than the required minimum	2026-05-18 07:08:10.587201	t	2026-05-18 07:23:11.171879
995	4	28	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:23:11.248135	t	2026-05-18 08:23:10.648307
996	4	28	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 07:23:11.248135	t	2026-05-18 08:23:10.648307
981	7	15	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 07:23:10.747913	t	2026-05-18 08:23:11.107499
992	6	30	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 07:23:11.171879	t	2026-05-18 08:23:11.733559
1018	4	36	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 08:23:11.37327	t	2026-05-18 08:38:10.565929
1019	4	36	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:11.37327	t	2026-05-18 08:38:10.565929
1020	5	23	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:23:11.507621	t	2026-05-18 08:38:10.659134
1025	2	2	os_update	high	OS version is below the required minimum	2026-05-18 08:23:11.641833	t	2026-05-18 08:38:10.750665
1008	5	37	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:23:10.985383	t	2026-05-18 08:38:11.243939
1011	7	15	os_update	high	OS version is below the required minimum	2026-05-18 08:23:11.107499	t	2026-05-18 08:38:11.379533
1014	2	34	password_expiry	low	Password has not been changed within the required period	2026-05-18 08:23:11.238096	t	2026-05-18 08:38:11.527309
1015	2	34	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:11.238096	t	2026-05-18 08:38:11.527309
1041	6	19	os_update	high	OS version is below the required minimum	2026-05-18 08:38:11.063586	t	2026-05-18 08:53:10.667724
1042	6	19	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:38:11.063586	t	2026-05-18 08:53:10.667724
1044	8	32	screen_lock	high	Screen lock is not configured	2026-05-18 08:38:11.197241	t	2026-05-18 08:53:10.781819
1045	8	32	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 08:38:11.197241	t	2026-05-18 08:53:10.781819
1046	11	24	os_update	high	OS version is below the required minimum	2026-05-18 08:38:11.333619	t	2026-05-18 08:53:10.922819
1047	7	15	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:38:11.379533	t	2026-05-18 08:53:10.964881
1048	7	15	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:38:11.379533	t	2026-05-18 08:53:10.964881
1012	7	15	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 08:23:11.107499	t	2026-05-18 08:53:10.964881
1049	7	15	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:38:11.379533	t	2026-05-18 08:53:10.964881
1050	6	25	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 08:38:11.425944	t	2026-05-18 08:53:11.042901
1051	6	25	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:38:11.425944	t	2026-05-18 08:53:11.042901
1052	6	25	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 08:38:11.425944	t	2026-05-18 08:53:11.042901
1053	11	18	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 08:38:11.476567	t	2026-05-18 08:53:11.087149
1054	2	34	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:38:11.527309	t	2026-05-18 08:53:11.110816
1027	4	36	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:38:10.565929	t	2026-05-18 08:53:11.176939
1029	8	21	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 08:38:10.600585	t	2026-05-18 08:53:11.22262
1030	4	22	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:38:10.628432	t	2026-05-18 08:53:11.256573
1031	5	23	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 08:38:10.659134	t	2026-05-18 08:53:11.286956
1038	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 08:38:10.840488	t	2026-05-18 08:53:11.545044
1039	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 08:38:10.949533	t	2026-05-18 08:53:11.675273
1063	11	24	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:10.922819	t	2026-05-18 09:08:10.541984
1064	11	38	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:53:11.00195	t	2026-05-18 09:08:10.694276
1065	6	25	screen_lock	high	Screen lock is not configured	2026-05-18 08:53:11.042901	t	2026-05-18 09:08:10.763323
1066	2	34	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 08:53:11.110816	t	2026-05-18 09:08:10.908682
1055	3	35	password_expiry	low	Password has not been changed within the required period	2026-05-18 08:38:11.597697	t	2026-05-18 09:08:10.984939
1067	3	35	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:53:11.151761	t	2026-05-18 09:08:10.984939
1068	4	36	os_update	high	OS version is below the required minimum	2026-05-18 08:53:11.176939	t	2026-05-18 09:08:11.067192
1028	4	36	password_expiry	low	Password has not been changed within the required period	2026-05-18 08:38:10.565929	t	2026-05-18 09:08:11.067192
1069	8	21	os_update	high	OS version is below the required minimum	2026-05-18 08:53:11.22262	t	2026-05-18 09:08:11.161377
1070	8	21	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:11.22262	t	2026-05-18 09:08:11.161377
1071	4	22	os_update	high	OS version is below the required minimum	2026-05-18 08:53:11.256573	t	2026-05-18 09:08:11.246056
1021	5	23	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:23:11.507621	t	2026-05-18 09:08:11.316831
1073	7	26	os_update	high	OS version is below the required minimum	2026-05-18 08:53:11.309768	t	2026-05-18 09:08:11.383599
1032	7	26	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:38:10.678892	t	2026-05-18 09:08:11.383599
1034	3	12	os_update	high	OS version is below the required minimum	2026-05-18 08:38:10.781831	t	2026-05-18 09:08:11.633644
1078	6	30	os_update	high	OS version is below the required minimum	2026-05-18 08:53:11.491566	t	2026-05-18 09:08:11.719954
1037	4	13	os_update	high	OS version is below the required minimum	2026-05-18 08:38:10.840488	t	2026-05-18 09:08:11.80779
1056	6	14	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 08:53:10.605242	t	2026-05-18 09:08:12.190229
1057	6	14	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:10.605242	t	2026-05-18 09:08:12.190229
1043	2	11	os_update	high	OS version is below the required minimum	2026-05-18 08:38:11.11733	t	2026-05-18 09:08:12.369953
1061	1	33	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 08:53:10.874468	t	2026-05-18 09:08:12.716542
1062	1	33	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:10.874468	t	2026-05-18 09:08:12.716542
1060	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:10.707948	t	2026-05-18 10:08:12.292917
1033	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:38:10.750665	t	2026-05-18 08:53:11.396456
1040	3	3	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:38:10.949533	t	2026-05-18 08:53:11.675273
1075	2	2	os_update	high	OS version is below the required minimum	2026-05-18 08:53:11.396456	t	2026-05-18 09:08:11.550769
1084	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:11.675273	t	2026-05-18 09:08:12.041728
1072	5	23	password_length	medium	Password is shorter than the required minimum	2026-05-18 08:53:11.286956	t	2026-05-18 10:08:11.171438
1100	4	13	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 09:08:11.80779	t	2026-05-18 10:08:11.624225
1083	3	3	os_update	high	OS version is below the required minimum	2026-05-18 08:53:11.675273	t	2026-05-18 10:08:11.850692
1101	3	3	password_length	medium	Password is shorter than the required minimum	2026-05-18 09:08:12.041728	t	2026-05-18 10:08:11.850692
1086	7	15	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 09:08:10.628366	t	2026-05-18 10:08:11.998761
1105	6	19	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 09:08:12.281824	t	2026-05-18 10:08:12.206238
1106	6	19	os_update	high	OS version is below the required minimum	2026-05-18 09:08:12.281824	t	2026-05-18 10:08:12.206238
1097	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 09:08:11.550769	t	2026-05-18 10:23:11.994728
1099	4	13	password_length	medium	Password is shorter than the required minimum	2026-05-18 09:08:11.80779	t	2026-05-18 10:38:11.041459
1089	11	18	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 09:08:10.829845	t	2026-05-18 10:38:11.8363
1109	8	32	password_expiry	low	Password has not been changed within the required period	2026-05-18 09:08:12.5255	t	2026-05-18 10:38:12.040856
1093	4	36	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 09:08:11.067192	t	2026-05-18 10:38:12.407508
1074	7	26	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:11.309768	t	2026-05-18 09:08:11.383599
1076	3	12	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 08:53:11.445734	t	2026-05-18 09:08:11.633644
1077	3	12	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:53:11.445734	t	2026-05-18 09:08:11.633644
1036	6	30	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 08:38:10.810033	t	2026-05-18 09:08:11.719954
1080	8	27	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 08:53:11.585266	t	2026-05-18 09:08:11.882815
1058	6	14	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 08:53:10.605242	t	2026-05-18 09:08:12.190229
1059	6	14	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:53:10.605242	t	2026-05-18 09:08:12.190229
1087	6	25	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 09:08:10.763323	t	2026-05-18 10:08:10.533199
1088	6	25	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 09:08:10.763323	t	2026-05-18 10:08:10.533199
1111	1	33	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 09:08:12.716542	t	2026-05-18 10:08:10.840258
1092	3	35	os_update	high	OS version is below the required minimum	2026-05-18 09:08:10.984939	t	2026-05-18 10:08:10.911779
1095	4	22	password_length	medium	Password is shorter than the required minimum	2026-05-18 09:08:11.246056	t	2026-05-18 10:08:11.12213
1098	6	30	password_expiry	low	Password has not been changed within the required period	2026-05-18 09:08:11.719954	t	2026-05-18 10:08:11.540734
1081	8	27	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:53:11.585266	t	2026-05-18 10:08:11.704775
1085	11	24	os_update	high	OS version is below the required minimum	2026-05-18 09:08:10.541984	t	2026-05-18 10:08:11.92141
1108	7	20	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 09:08:12.454424	t	2026-05-18 10:08:12.366701
1104	6	14	os_update	high	OS version is below the required minimum	2026-05-18 09:08:12.190229	t	2026-05-18 10:23:10.627785
1107	7	20	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 09:08:12.454424	t	2026-05-18 10:23:10.874402
1035	6	30	password_expiry	low	Password has not been changed within the required period	2026-05-18 08:38:10.810033	t	2026-05-18 08:53:11.491566
1079	6	30	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:53:11.491566	t	2026-05-18 09:08:11.719954
1090	2	34	password_expiry	low	Password has not been changed within the required period	2026-05-18 09:08:10.908682	t	2026-05-18 10:08:10.680312
1091	2	34	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 09:08:10.908682	t	2026-05-18 10:08:10.680312
1094	8	21	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 09:08:11.161377	t	2026-05-18 10:08:11.050976
1096	7	26	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 09:08:11.383599	t	2026-05-18 10:08:11.256209
1082	4	28	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 08:53:11.629892	t	2026-05-18 10:08:11.776373
1102	1	10	password_length	medium	Password is shorter than the required minimum	2026-05-18 09:08:12.120285	t	2026-05-18 10:08:12.075649
1103	1	10	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 09:08:12.120285	t	2026-05-18 10:23:10.535641
1130	6	14	screen_lock	high	Screen lock is not configured	2026-05-18 10:08:12.138144	t	2026-05-18 10:23:10.627785
1131	6	19	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:08:12.206238	t	2026-05-18 10:23:10.72106
1115	2	34	os_update	high	OS version is below the required minimum	2026-05-18 10:08:10.680312	t	2026-05-18 11:23:10.688845
1113	11	18	os_update	high	OS version is below the required minimum	2026-05-18 10:08:10.600286	t	2026-05-18 10:23:11.004526
1114	11	18	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:08:10.600286	t	2026-05-18 10:23:11.004526
1132	11	38	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:08:12.426	t	2026-05-18 10:23:11.161874
1133	11	38	password_expiry	low	Password has not been changed within the required period	2026-05-18 10:08:12.426	t	2026-05-18 10:23:11.161874
1134	8	32	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 10:08:12.513027	t	2026-05-18 10:23:11.2528
1116	5	37	os_update	high	OS version is below the required minimum	2026-05-18 10:08:10.745888	t	2026-05-18 10:23:11.331002
1110	5	37	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 09:08:12.621949	t	2026-05-18 10:23:11.331002
1118	3	35	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:08:10.911779	t	2026-05-18 10:23:11.480822
1119	3	35	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:08:10.911779	t	2026-05-18 10:23:11.480822
1120	3	35	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:08:10.911779	t	2026-05-18 10:23:11.480822
1121	4	36	password_expiry	low	Password has not been changed within the required period	2026-05-18 10:08:10.975338	t	2026-05-18 10:23:11.557651
1122	4	36	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:08:10.975338	t	2026-05-18 10:23:11.557651
1124	5	23	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:08:11.171438	t	2026-05-18 10:23:11.78484
1125	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:08:11.390427	t	2026-05-18 10:23:11.994728
1126	6	30	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:08:11.540734	t	2026-05-18 10:23:12.142725
1127	4	28	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:08:11.776373	t	2026-05-18 10:23:12.37993
1128	3	3	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:08:11.850692	t	2026-05-18 10:23:12.457423
1155	2	2	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:23:11.994728	t	2026-05-18 10:38:10.883315
1156	6	30	password_expiry	low	Password has not been changed within the required period	2026-05-18 10:23:12.142725	t	2026-05-18 10:38:10.990507
1157	8	27	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:23:12.302435	t	2026-05-18 10:38:11.092337
1158	4	28	os_update	high	OS version is below the required minimum	2026-05-18 10:23:12.37993	t	2026-05-18 10:38:11.150224
1159	4	28	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 10:23:12.37993	t	2026-05-18 10:38:11.150224
1135	6	14	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:23:10.627785	t	2026-05-18 10:38:11.261203
1138	2	11	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:23:10.800084	t	2026-05-18 10:38:11.399429
1139	2	11	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:23:10.800084	t	2026-05-18 10:38:11.399429
1140	7	20	os_update	high	OS version is below the required minimum	2026-05-18 10:23:10.874402	t	2026-05-18 10:38:11.478314
1160	3	3	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:23:12.457423	t	2026-05-18 10:38:11.55186
1161	11	24	os_update	high	OS version is below the required minimum	2026-05-18 10:23:12.536445	t	2026-05-18 10:38:11.623515
1162	11	24	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 10:23:12.536445	t	2026-05-18 10:38:11.623515
1129	7	15	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:08:11.998761	t	2026-05-18 10:38:11.70392
1142	6	25	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:23:10.93907	t	2026-05-18 10:38:11.774614
1143	6	25	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:23:10.93907	t	2026-05-18 10:38:11.774614
1112	11	18	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:08:10.600286	t	2026-05-18 10:38:11.8363
1145	2	34	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:23:11.083741	t	2026-05-18 10:38:11.900067
1146	8	32	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:23:11.2528	t	2026-05-18 10:38:12.040856
1147	8	32	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:23:11.2528	t	2026-05-18 10:38:12.040856
1148	5	37	password_expiry	low	Password has not been changed within the required period	2026-05-18 10:23:11.331002	t	2026-05-18 10:38:12.100303
1117	1	33	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 10:08:10.840258	t	2026-05-18 10:38:12.175814
1149	3	35	password_length	medium	Password is shorter than the required minimum	2026-05-18 10:23:11.480822	t	2026-05-18 10:38:12.332388
1150	8	21	os_update	high	OS version is below the required minimum	2026-05-18 10:23:11.64288	t	2026-05-18 10:38:12.472566
1151	8	21	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:23:11.64288	t	2026-05-18 10:38:12.472566
1136	6	14	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:23:10.627785	t	2026-05-18 11:08:10.542625
1137	2	11	os_update	high	OS version is below the required minimum	2026-05-18 10:23:10.800084	t	2026-05-18 11:08:10.654668
1141	7	20	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:23:10.874402	t	2026-05-18 11:08:10.69804
1123	4	36	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:08:10.975338	t	2026-05-18 11:08:11.270219
1166	7	26	os_update	high	OS version is below the required minimum	2026-05-18 10:38:10.756313	t	2026-05-18 11:08:11.349783
1152	5	23	os_update	high	OS version is below the required minimum	2026-05-18 10:23:11.78484	t	2026-05-18 10:38:10.663281
1163	5	23	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:38:10.663281	t	2026-05-18 11:08:11.051994
1164	5	23	password_length	medium	Password is shorter than the required minimum	2026-05-18 10:38:10.663281	t	2026-05-18 11:08:11.051994
1165	5	23	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 10:38:10.663281	t	2026-05-18 11:08:11.051994
1169	2	2	os_update	high	OS version is below the required minimum	2026-05-18 10:38:10.883315	t	2026-05-18 11:08:11.438215
1170	2	2	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:38:10.883315	t	2026-05-18 11:08:11.438215
1173	1	10	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:38:11.208206	t	2026-05-18 11:08:11.719854
1195	11	18	screen_lock	high	Screen lock is not configured	2026-05-18 11:08:10.888904	t	2026-05-18 11:23:10.650673
1196	11	18	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:08:10.888904	t	2026-05-18 11:23:10.650673
1207	5	37	os_update	high	OS version is below the required minimum	2026-05-18 11:08:11.137612	t	2026-05-18 11:23:10.875134
1210	4	36	screen_lock	high	Screen lock is not configured	2026-05-18 11:08:11.270219	t	2026-05-18 11:23:10.968319
1211	4	36	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:08:11.270219	t	2026-05-18 11:23:10.968319
1214	1	1	os_update	high	OS version is below the required minimum	2026-05-18 11:08:11.394094	t	2026-05-18 11:23:11.052578
1215	1	1	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:08:11.394094	t	2026-05-18 11:23:11.052578
1216	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:08:11.394094	t	2026-05-18 11:23:11.052578
1219	6	30	os_update	high	OS version is below the required minimum	2026-05-18 11:08:11.535267	t	2026-05-18 11:23:11.177655
1189	2	11	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:08:10.654668	t	2026-05-18 11:23:11.328205
1190	2	11	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:08:10.654668	t	2026-05-18 11:23:11.328205
1193	11	24	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:08:10.768831	t	2026-05-18 11:38:10.676468
1203	4	22	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:08:11.021072	t	2026-05-18 11:38:10.955341
1175	7	15	password_length	medium	Password is shorter than the required minimum	2026-05-18 10:38:11.70392	t	2026-05-18 11:08:10.803918
1177	2	34	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:38:11.900067	t	2026-05-18 11:08:10.938039
1180	5	37	password_length	medium	Password is shorter than the required minimum	2026-05-18 10:38:12.100303	t	2026-05-18 11:08:11.137612
1181	5	37	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:38:12.100303	t	2026-05-18 11:08:11.137612
1182	4	36	os_update	high	OS version is below the required minimum	2026-05-18 10:38:12.407508	t	2026-05-18 11:08:11.270219
1167	7	26	password_length	medium	Password is shorter than the required minimum	2026-05-18 10:38:10.756313	t	2026-05-18 11:08:11.349783
1168	7	26	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:38:10.756313	t	2026-05-18 11:08:11.349783
1171	8	27	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:38:11.092337	t	2026-05-18 11:08:11.624254
1202	11	38	password_expiry	low	Password has not been changed within the required period	2026-05-18 11:08:10.983197	t	2026-05-18 11:23:10.726557
1205	8	32	os_update	high	OS version is below the required minimum	2026-05-18 11:08:11.08895	t	2026-05-18 11:23:10.839578
1206	8	32	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:08:11.08895	t	2026-05-18 11:23:10.839578
1208	3	35	os_update	high	OS version is below the required minimum	2026-05-18 11:08:11.224664	t	2026-05-18 11:23:10.9363
1209	3	35	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:08:11.224664	t	2026-05-18 11:23:10.9363
1183	4	36	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 10:38:12.407508	t	2026-05-18 11:23:10.968319
1220	8	27	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:08:11.624254	t	2026-05-18 11:23:11.250775
1187	6	19	password_complexity	medium	Password does not meet complexity requirements	2026-05-18 11:08:10.614138	t	2026-05-18 11:23:11.290314
1188	6	19	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:08:10.614138	t	2026-05-18 11:23:11.290314
1192	3	3	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:08:10.731289	t	2026-05-18 11:23:11.402473
1213	7	26	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:08:11.349783	t	2026-05-18 11:38:11.412557
1153	1	1	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:23:11.930199	t	2026-05-18 10:38:10.822172
1154	1	1	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:23:11.930199	t	2026-05-18 10:38:10.822172
1144	6	25	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:23:10.93907	t	2026-05-18 10:38:11.774614
1176	6	25	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 10:38:11.774614	t	2026-05-18 11:08:10.845486
1178	11	38	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:38:11.972003	t	2026-05-18 11:08:10.983197
1179	11	38	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:38:11.972003	t	2026-05-18 11:08:10.983197
1184	8	21	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 10:38:12.472566	t	2026-05-18 11:08:11.311182
1185	8	21	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:38:12.472566	t	2026-05-18 11:08:11.311182
1172	4	28	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 10:38:11.150224	t	2026-05-18 11:08:11.680698
1194	7	15	os_update	high	OS version is below the required minimum	2026-05-18 11:08:10.803918	t	2026-05-18 11:23:10.539913
1197	2	34	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:08:10.938039	t	2026-05-18 11:23:10.688845
1198	2	34	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:08:10.938039	t	2026-05-18 11:23:10.688845
1200	2	34	usb	high	USB access is enabled — policy requires it to be blocked	2026-05-18 11:08:10.938039	t	2026-05-18 11:23:10.688845
1201	2	34	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:08:10.938039	t	2026-05-18 11:23:10.688845
1212	8	21	os_update	high	OS version is below the required minimum	2026-05-18 11:08:11.311182	t	2026-05-18 11:23:10.99563
1217	2	2	encryption	critical	Device encryption is disabled — data at risk	2026-05-18 11:08:11.438215	t	2026-05-18 11:23:11.084161
1218	2	2	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:08:11.438215	t	2026-05-18 11:23:11.084161
1186	6	14	bluetooth	medium	Bluetooth is enabled — policy requires it to be disabled	2026-05-18 11:08:10.542625	t	2026-05-18 11:23:11.114458
1174	6	19	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 10:38:11.33129	t	2026-05-18 11:23:11.290314
1191	7	20	password_length	medium	Password is shorter than the required minimum	2026-05-18 11:08:10.69804	t	2026-05-18 11:23:11.370037
1221	1	10	os_update	high	OS version is below the required minimum	2026-05-18 11:08:11.719854	t	2026-05-18 11:23:11.488721
1199	2	34	password_expiry	low	Password has not been changed within the required period	2026-05-18 11:08:10.938039	t	2026-05-18 11:38:10.85524
1204	5	23	wifi	medium	Unrestricted Wi-Fi access detected	2026-05-18 11:08:11.051994	t	2026-05-18 11:53:11.098554
\.


--
-- Data for Name: device_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_activities (id, device_id, event_type, message, created_at) FROM stdin;
1	1	policy_deployed	Policy #4: All rules deployed and verified	2026-05-11 10:09:53.214834
2	2	policy_deployed	Policy #4: All rules deployed and verified	2026-05-11 10:09:53.239842
3	3	policy_deployed	Policy #4: Policy applied successfully	2026-05-11 10:09:53.264052
4	4	policy_deployed	Policy #4: All rules deployed and verified	2026-05-11 10:09:53.278345
5	1	heartbeat	Agent check-in — battery: 72%, network: wifi	2026-05-12 11:17:55.021313
6	2	heartbeat	Agent check-in — battery: 45%, network: cellular	2026-05-12 11:20:30.208239
7	3	heartbeat	Agent check-in — battery: 15%, network: wifi	2026-05-12 11:20:46.05619
8	4	heartbeat	Agent check-in — battery: 88%, network: ethernet	2026-05-12 11:21:01.556844
9	5	heartbeat	Agent check-in — battery: 62%, network: wifi	2026-05-12 11:21:17.440453
10	1	offline	Device went offline — last seen 2026-05-12 11:17:54.991473	2026-05-12 11:51:19.995982
11	2	offline	Device went offline — last seen 2026-05-12 11:20:30.206028	2026-05-12 11:51:19.995982
12	3	offline	Device went offline — last seen 2026-05-12 11:20:46.056190	2026-05-12 11:51:19.995982
13	4	offline	Device went offline — last seen 2026-05-12 11:21:01.556844	2026-05-12 11:51:19.995982
14	5	offline	Device went offline — last seen 2026-05-12 11:21:17.440453	2026-05-12 11:51:19.995982
15	6	policy_deployed	Policy #4: All rules deployed and verified	2026-05-18 05:39:23.586927
16	7	policy_deployed	Policy #4: Policy applied successfully	2026-05-18 05:39:23.628234
17	8	policy_failed	Policy #4: Unsupported OS version	2026-05-18 05:39:23.65013
18	5	policy_failed	Policy #4: Network timeout during deployment	2026-05-18 05:39:23.671176
19	11	policy_deployed	Policy #4: All rules deployed and verified	2026-05-18 05:39:23.682081
20	6	policy_deployed	Policy #3: All rules deployed and verified	2026-05-18 05:39:23.702896
21	7	policy_deployed	Policy #3: Policy synced and active	2026-05-18 05:39:23.729724
22	8	policy_deployed	Policy #3: All rules deployed and verified	2026-05-18 05:39:23.750208
23	4	policy_deployed	Policy #3: Policy synced and active	2026-05-18 05:39:23.778534
24	5	policy_deployed	Policy #3: Policy synced and active	2026-05-18 05:39:23.809196
25	11	policy_deployed	Policy #3: Policy synced and active	2026-05-18 05:39:23.834933
26	6	policy_deployed	Policy #2: All rules deployed and verified	2026-05-18 05:39:23.858792
27	7	policy_deployed	Policy #2: Policy applied successfully	2026-05-18 05:39:23.888531
28	8	policy_deployed	Policy #2: Policy synced and active	2026-05-18 05:39:23.915378
29	4	policy_deployed	Policy #2: Policy applied successfully	2026-05-18 05:39:23.953698
30	11	policy_failed	Policy #2: Device offline — could not reach agent	2026-05-18 05:39:23.986062
31	6	policy_deployed	Policy #5: All rules deployed and verified	2026-05-18 05:39:24.007372
32	7	policy_failed	Policy #5: Unsupported OS version	2026-05-18 05:39:24.030398
33	8	policy_deployed	Policy #5: Policy applied successfully	2026-05-18 05:39:24.051763
34	1	policy_deployed	Policy #5: Policy synced and active	2026-05-18 05:39:24.083798
35	2	policy_deployed	Policy #5: Policy applied successfully	2026-05-18 05:39:24.119395
36	3	policy_deployed	Policy #5: Policy applied successfully	2026-05-18 05:39:24.141135
37	4	policy_deployed	Policy #5: Policy synced and active	2026-05-18 05:39:24.172983
38	5	policy_deployed	Policy #5: Policy applied successfully	2026-05-18 05:39:24.193815
39	11	policy_deployed	Policy #5: Policy applied successfully	2026-05-18 05:39:24.222845
40	1	policy_retried	Policy #3 retry → success: Policy applied successfully	2026-05-18 11:46:12.55003
\.


--
-- Data for Name: device_checkins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_checkins (id, device_id, battery, network, ip_address, checked_in_at) FROM stdin;
\.


--
-- Data for Name: device_commands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_commands (id, device_id, command_type, status, payload, issued_by, created_at, executed_at, response) FROM stdin;
1	2	lock	pending	{}	admin	2026-05-16 05:24:45.481268	\N	\N
2	2	lock	pending	{}	admin	2026-05-16 05:24:47.231426	\N	\N
3	2	lock	pending	{}	admin	2026-05-16 05:24:48.299261	\N	\N
4	2	sync	pending	{}	admin	2026-05-16 05:24:49.757092	\N	\N
5	2	lock	cancelled	{}	admin	2026-05-16 05:24:50.804745	\N	\N
6	2	lock	pending	{}	admin	2026-05-16 05:25:12.363477	\N	\N
7	2	wipe	pending	{}	admin	2026-05-16 05:25:22.682294	\N	\N
8	2	restart	pending	{}	admin	2026-05-16 05:25:27.427372	\N	\N
9	2	clear_passcode	pending	{}	admin	2026-05-16 05:25:35.149097	\N	\N
\.


--
-- Data for Name: device_enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_enrollments (id, device_id, token_id, enrolled_at, enrolled_by, enrollment_method, status) FROM stdin;
1	9	1	2026-05-11 07:26:57.271329	john	token	active
2	10	2	2026-05-15 12:18:41.959793	john	token	active
3	11	3	2026-05-16 10:24:09.114001		token	active
\.


--
-- Data for Name: device_group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_group_members (id, group_id, device_id, added_at) FROM stdin;
\.


--
-- Data for Name: device_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_groups (id, name, description, group_type, smart_rule, created_by, created_at, updated_at) FROM stdin;
1	Devices		smart	{"field":"status","op":"contains","value":"android"}	admin	2026-05-18 05:40:52.135735	2026-05-18 05:40:52.135735
\.


--
-- Data for Name: device_security_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_security_profiles (id, device_id, is_rooted, encryption_enabled, screen_lock_enabled, os_outdated, blacklisted_app_detected, risk_score, risk_level, last_evaluated_at, created_at, updated_at) FROM stdin;
8	11	f	t	t	t	f	15	low	2026-05-18 13:23:10.96155	2026-05-18 05:39:23.682081	2026-05-18 13:23:10.96155
5	5	f	f	t	f	f	25	medium	2026-05-18 13:23:11.337233	2026-05-12 10:57:50.17325	2026-05-18 13:23:11.337233
4	1	f	t	t	t	f	15	low	2026-05-18 13:23:12.027158	2026-05-12 10:57:21.501451	2026-05-18 13:23:12.029018
3	3	f	f	f	f	f	45	medium	2026-05-18 13:23:12.105671	2026-05-12 10:57:21.426319	2026-05-18 13:23:12.108324
1	4	f	f	t	t	f	40	medium	2026-05-18 13:23:12.27587	2026-05-12 10:57:21.226575	2026-05-18 13:23:12.277885
9	8	f	t	t	f	f	0	low	2026-05-18 13:23:12.429815	2026-05-18 05:39:23.761409	2026-05-18 13:23:12.429815
6	6	f	t	t	t	f	15	low	2026-05-18 13:23:12.574464	2026-05-18 05:39:23.602895	2026-05-18 13:23:12.574464
2	2	f	t	t	f	f	0	low	2026-05-18 13:23:12.638432	2026-05-12 10:57:21.342157	2026-05-18 13:23:12.638432
7	7	f	f	t	f	f	25	medium	2026-05-18 13:23:12.712642	2026-05-18 05:39:23.634034	2026-05-18 13:23:12.712642
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.devices (id, name, platform, os_version, status, owner, created_at, device_uid, serial_number, device_model, manufacturer, mac_address, department, enrollment_status, risk_level, last_seen, battery_level, storage_used, storage_total, agent_version, network_status, ip_address, online) FROM stdin;
6	MAC-DEV-03	macos	14.0	active	Neha Joshi	2026-05-05 13:01:49.304925	DEV-00006						unenrolled	low	\N	\N	\N	\N	\N	\N	\N	f
7	WIN-IT-088	windows	10.0.19045	active	Ravi Mehta	2026-05-05 13:01:49.304925	DEV-00007						unenrolled	low	\N	\N	\N	\N	\N	\N	\N	f
8	Android-SEC-07	android	14.0	active	Pooja Nair	2026-05-05 13:01:49.304925	DEV-00008						unenrolled	low	\N	\N	\N	\N	\N	\N	\N	f
9	rgrgr	windows	gnfgngf	active	john	2026-05-11 07:26:57.271329	DEV-B718FCF3	esfgsg	ghghjfgj	rtwet	ghgjgjkgdgsg	engg	enrolled	low	2026-05-11 07:26:57.271329	\N	\N	\N	\N	\N	\N	f
1	WIN-HR-221	windows	10.0.22000	active	Priya Shah	2026-05-05 13:01:49.304925	DEV-00001						unenrolled	low	2026-05-12 11:17:54.991473	72	42.5	128	1.0.0	wifi	192.168.1.10	f
2	Android-0921	android	13.0	active	Ramesh Kumar	2026-05-05 13:01:49.304925	DEV-00002						unenrolled	low	2026-05-12 11:20:30.206028	45	78	256	1.0.0	cellular	10.0.0.2	f
3	WIN-FIN-005	windows	11.0	active	Amit Verma	2026-05-05 13:01:49.304925	DEV-00003						unenrolled	low	2026-05-12 11:20:46.05619	15	110	128	0.9.5	wifi	192.168.1.20	f
4	iPhone-CEO	ios	17.0	active	Sunita Rao	2026-05-05 13:01:49.304925	DEV-00004						unenrolled	low	2026-05-12 11:21:01.556844	88	30	512	1.0.0	ethernet	192.168.2.5	f
5	Android-OPS-12	android	12.0	active	Vikram Singh	2026-05-05 13:01:49.304925	DEV-00005						unenrolled	low	2026-05-12 11:21:17.440453	62	55	128	1.0.1	wifi	192.168.1.30	f
10	sfsfghesg	android	terrhr	active	john	2026-05-15 12:18:41.95579	DEV-3DF5F69F	rt	rwery	erwertr	hjhtre	engineering	enrolled	low	2026-05-15 12:18:41.953344	\N	\N	\N	\N	\N	\N	f
11	Laptop	windows	Windows	active		2026-05-16 10:24:09.105612	DEV-107E0CA0	11	wind	sdd	jgjdsad		enrolled	low	2026-05-16 10:24:09.105612	\N	\N	\N	\N	\N	\N	f
\.


--
-- Data for Name: directory_agents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.directory_agents (id, email, name, team, tier, categories, is_active, created_at, updated_at) FROM stdin;
2	bob@risktrix.com	Bob	security	senior	malware	t	2026-05-15 10:24:48.135412	2026-05-15 10:24:48.135412
3	leo@risktrix.com	leo	security	standard	dwefef	t	2026-05-15 11:32:06.804531	2026-05-15 11:32:06.804531
4	sam@risktrix.com	sam	security	standard	defecsc	f	2026-05-15 11:32:44.870183	2026-05-18 11:40:34.124994
1	alice@risktrix.com	Alice	security	standard	network,malware	t	2026-05-13 10:59:46.395305	2026-05-18 11:48:32.821524
5	san@risktrix.com	san	security	standard	phishing	t	2026-05-18 11:49:13.083874	2026-05-18 11:49:13.083874
\.


--
-- Data for Name: enrollment_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enrollment_tokens (id, token, platform, created_by, expires_at, used, used_at, used_by_device_id, created_at) FROM stdin;
1	XZAvtGbgYymTrKMAe9RuSlnB4itgz1AT-VU3lWMvvmY	windows	admin	2026-05-12 07:09:55.979935	t	2026-05-11 07:26:57.271329	9	2026-05-11 07:09:55.981946
2	d44Byc6unDOtUrCDgokjj20yC5xhePyTv_Xd4E999fs	android	admin	2026-05-16 12:15:47.429656	t	2026-05-15 12:18:41.958795	10	2026-05-15 12:15:47.444821
3	3OiMeeJMDsdV0W8JvBgDhJNmhPGaaXIJ0vWg54zeYBo	windows	admin	2026-05-17 10:22:08.486836	t	2026-05-16 10:24:09.105612	11	2026-05-16 10:22:08.496773
\.


--
-- Data for Name: eosl_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eosl_records (id, product_name, vendor_name, version, category, end_of_sale_date, end_of_support_date, end_of_extended_support_date, risk_level, business_impact, remediation_plan, remediation_deadline, application_id, owner_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: group_policy_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_policy_assignments (id, group_id, policy_id, assigned_by, assigned_at) FROM stdin;
\.


--
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.organizations (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: outbox_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.outbox_events (id, event_type, payload, status, retry_count, created_at, processed_at, error) FROM stdin;
10	ticket.sla_breached	{"ticket_number": "TKT-00018", "title": "VPN Access Issue", "priority": "critical", "breach_type": "response", "agent_email": "eve@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.372977	no handler registered
1	ticket.created	{"ticket_number": "TKT-00012", "title": "fgjgjgfsg", "status": "assigned", "priority": "low", "category": "general", "user_email": null, "agent_email": "leo@risktrix.com"}	done	0	2026-05-14 07:33:01.439089	2026-05-14 07:33:02.913465	\N
11	ticket.sla_breached	{"ticket_number": "TKT-00006", "title": "Server down", "priority": "critical", "breach_type": "response", "agent_email": "bob@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.402908	no handler registered
2	ticket.created	{"ticket_number": "TKT-00013", "title": "string", "status": "assigned", "priority": "low", "category": "general", "user_email": null, "agent_email": "mia@risktrix.com"}	done	0	2026-05-14 11:27:34.202055	2026-05-14 11:27:34.632404	\N
12	ticket.sla_breached	{"ticket_number": "TKT-00008", "title": "Critical server issue", "priority": "high", "breach_type": "response", "agent_email": "bob@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.408938	no handler registered
3	ticket.created	{"ticket_number": "TKT-00014", "title": "string", "status": "assigned", "priority": "low", "category": "general", "user_email": null, "agent_email": "leo@risktrix.com"}	done	0	2026-05-14 11:28:18.412957	2026-05-14 11:28:19.965107	\N
6	ticket.resolved	{"ticket_number": "TKT-00014", "title": "string", "status": "resolved", "priority": "low", "category": "string", "resolution_notes": "string", "user_email": null, "agent_email": null}	failed	3	2026-05-14 11:47:31.622801	\N	Client error '422 Unprocessable Entity' for url 'http://localhost:8006/api/v1/notify/ticket'\nFor more information check: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
4	ticket.created	{"ticket_number": "TKT-00015", "title": "string", "status": "assigned", "priority": "low", "category": "general", "user_email": null, "agent_email": "mia@risktrix.com"}	done	0	2026-05-14 11:35:04.90873	2026-05-14 11:35:05.63354	\N
13	ticket.sla_breached	{"ticket_number": "TKT-00009", "title": "auth issue", "priority": "high", "breach_type": "response", "agent_email": "alice@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.41271	no handler registered
5	ticket.created	{"ticket_number": "TKT-00016", "title": "string", "status": "assigned", "priority": "low", "category": "general", "user_email": null, "agent_email": "leo@risktrix.com"}	done	0	2026-05-14 11:44:37.629619	2026-05-14 11:44:41.58917	\N
7	ticket.resolved	{"ticket_number": "TKT-00016", "title": "string", "status": "resolved", "priority": "low", "category": "general", "resolution_notes": "swdqw", "user_email": null, "agent_email": null}	failed	3	2026-05-15 07:15:43.914293	\N	Client error '422 Unprocessable Entity' for url 'http://localhost:8006/api/v1/notify/ticket'\nFor more information check: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422
14	ticket.sla_breached	{"ticket_number": "TKT-00010", "title": "auth issue2", "priority": "critical", "breach_type": "response", "agent_email": "bob@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.416735	no handler registered
9	ticket.created	{"ticket_number": "TKT-00018", "title": "VPN Access Issue", "status": "assigned", "priority": "critical", "category": "network", "user_email": null, "agent_email": "eve@risktrix.com"}	done	0	2026-05-16 06:22:18.160439	2026-05-16 06:22:22.688805	\N
8	ticket.created	{"ticket_number": "TKT-00017", "title": " bnbdgngf", "status": "assigned", "priority": "low", "category": "security", "user_email": null, "agent_email": "alice@risktrix.com"}	done	0	2026-05-15 11:19:22.503531	2026-05-15 11:19:24.469971	\N
15	ticket.sla_breached	{"ticket_number": "TKT-00011", "title": "Critical auth issue22", "priority": "critical", "breach_type": "response", "agent_email": "alice@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.420758	no handler registered
16	ticket.sla_breached	{"ticket_number": "TKT-00012", "title": "fgjgjgfsg", "priority": "low", "breach_type": "response", "agent_email": "leo@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.424781	no handler registered
17	ticket.sla_breached	{"ticket_number": "TKT-00013", "title": "string", "priority": "low", "breach_type": "response", "agent_email": "mia@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.428549	no handler registered
18	ticket.sla_breached	{"ticket_number": "TKT-00015", "title": "string", "priority": "low", "breach_type": "response", "agent_email": "mia@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.531233	2026-05-16 08:41:56.432567	no handler registered
19	ticket.sla_breached	{"ticket_number": "TKT-00003", "title": "Cart is not adding items", "priority": "high", "breach_type": "resolution", "agent_email": null, "user_email": null}	done	0	2026-05-16 08:41:52.549043	2026-05-16 08:41:56.434582	no handler registered
20	ticket.sla_breached	{"ticket_number": "TKT-00006", "title": "Server down", "priority": "critical", "breach_type": "resolution", "agent_email": "bob@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.549043	2026-05-16 08:41:56.43659	no handler registered
21	ticket.sla_breached	{"ticket_number": "TKT-00008", "title": "Critical server issue", "priority": "high", "breach_type": "resolution", "agent_email": "bob@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.549043	2026-05-16 08:41:56.440607	no handler registered
22	ticket.sla_breached	{"ticket_number": "TKT-00009", "title": "auth issue", "priority": "high", "breach_type": "resolution", "agent_email": "alice@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.549043	2026-05-16 08:41:56.442623	no handler registered
23	ticket.sla_breached	{"ticket_number": "TKT-00010", "title": "auth issue2", "priority": "critical", "breach_type": "resolution", "agent_email": "bob@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.549043	2026-05-16 08:41:56.446421	no handler registered
24	ticket.sla_breached	{"ticket_number": "TKT-00011", "title": "Critical auth issue22", "priority": "critical", "breach_type": "resolution", "agent_email": "alice@risktrix.com", "user_email": null}	done	0	2026-05-16 08:41:52.549043	2026-05-16 08:41:56.448436	no handler registered
25	ticket.sla_breached	{"ticket_number": "TKT-00018", "title": "VPN Access Issue", "priority": "critical", "breach_type": "resolution", "agent_email": "eve@risktrix.com", "user_email": null}	done	0	2026-05-16 10:23:11.573248	2026-05-16 10:23:15.449733	\N
26	ticket.sla_breached	{"ticket_number": "TKT-00017", "title": " bnbdgngf", "priority": "low", "breach_type": "response", "agent_email": "alice@risktrix.com", "user_email": null}	done	0	2026-05-16 11:20:11.929947	2026-05-16 11:20:14.267056	\N
31	ticket.sla_breached	{"ticket_number": "TKT-00014", "title": "string", "priority": "low", "breach_type": "resolution", "agent_email": "string", "user_email": null}	done	0	2026-05-18 07:27:01.661596	2026-05-18 07:27:02.399911	\N
27	ticket.sla_breached	{"ticket_number": "TKT-00012", "title": "fgjgjgfsg", "priority": "low", "breach_type": "resolution", "agent_email": "leo@risktrix.com", "user_email": null}	done	0	2026-05-18 05:25:02.301482	2026-05-18 05:26:29.009444	\N
28	ticket.sla_breached	{"ticket_number": "TKT-00013", "title": "string", "priority": "low", "breach_type": "resolution", "agent_email": "mia@risktrix.com", "user_email": null}	done	0	2026-05-18 05:25:02.301482	2026-05-18 05:26:29.411859	\N
29	ticket.sla_breached	{"ticket_number": "TKT-00015", "title": "string", "priority": "low", "breach_type": "resolution", "agent_email": "mia@risktrix.com", "user_email": null}	done	0	2026-05-18 05:25:02.301482	2026-05-18 05:26:29.742877	\N
32	ticket.sla_breached	{"ticket_number": "TKT-00017", "title": " bnbdgngf", "priority": "low", "breach_type": "resolution", "agent_email": "alice@risktrix.com", "user_email": null}	done	0	2026-05-18 11:20:02.058389	2026-05-18 11:20:04.455093	\N
30	ticket.sla_breached	{"ticket_number": "TKT-00018", "title": "VPN Access Issue", "priority": "critical", "breach_type": "resolution", "agent_email": "eve@risktrix.com", "user_email": null}	done	0	2026-05-18 07:24:21.470799	2026-05-18 07:24:21.987959	\N
\.


--
-- Data for Name: policies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.policies (id, name, description, category, platform, require_screen_lock, min_password_length, password_complexity, password_expiry_days, bluetooth_disabled, usb_disabled, wifi_restricted, os_update_required, min_os_version, encryption_required, status, created_at) FROM stdin;
4	Test policy2		app_control	android	t	8	t	0	t	t	t	t		t	draft	2026-05-08 07:33:52.387456
3	Test policy		network	windows	f	8	t	0	t	t	t	t		t	active	2026-05-07 05:24:47.84604
2	OS Policy		network	ios	t	8	t	0	t	t	t	t		t	active	2026-05-05 07:28:53.746757
5	iOS Strict	High-security policy for corporate iOS devices. Restricts connectivity and enforces strong authentication.	device_security	ios	t	8	t	60	t	t	t	t	16.0	t	active	2026-05-11 11:31:19.050316
\.


--
-- Data for Name: policy_device_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.policy_device_assignments (id, policy_id, device_id, assigned_at, deployment_status, assigned_by, deployment_message, applied_at, last_checked_at, compliance_status, compliance_score) FROM stdin;
29	2	11	2026-05-18 05:39:23.967085	failed	admin	Device offline — could not reach agent	\N	2026-05-18 05:39:23.967085	unknown	0
28	2	4	2026-05-18 05:39:23.935937	success	admin	Policy applied successfully	2026-05-18 05:39:23.935937	2026-05-18 13:23:11.669845	compliant	100
36	5	4	2026-05-18 05:39:24.156879	success	admin	Policy synced and active	2026-05-18 05:39:24.156879	2026-05-18 13:23:11.747641	compliant	100
21	3	8	2026-05-18 05:39:23.745587	success	admin	All rules deployed and verified	2026-05-18 05:39:23.745587	2026-05-18 13:23:11.823422	warning	75
26	2	7	2026-05-18 05:39:23.872822	success	admin	Policy applied successfully	2026-05-18 05:39:23.872822	2026-05-18 13:23:11.8956	compliant	100
1	2	1	2026-05-05 07:45:44.848547	success	admin		\N	2026-05-18 13:23:11.968587	warning	79
12	4	3	2026-05-11 10:09:53.24329	success	admin	Policy applied successfully	2026-05-11 10:09:53.248705	2026-05-18 13:23:12.047512	non_compliant	63
30	5	6	2026-05-18 05:39:23.992099	success	admin	All rules deployed and verified	2026-05-18 05:39:23.994112	2026-05-18 13:23:12.136731	warning	65
13	4	4	2026-05-11 10:09:53.265074	success	admin	All rules deployed and verified	2026-05-11 10:09:53.265074	2026-05-18 13:23:12.216129	non_compliant	58
15	4	7	2026-05-18 05:39:23.618168	success	admin	Policy applied successfully	2026-05-18 05:39:23.62018	2026-05-18 13:23:12.295565	non_compliant	79
27	2	8	2026-05-18 05:39:23.904565	success	admin	Policy synced and active	2026-05-18 05:39:23.904565	2026-05-18 13:23:12.371912	compliant	100
25	2	6	2026-05-18 05:39:23.851633	success	admin	All rules deployed and verified	2026-05-18 05:39:23.851633	2026-05-18 13:23:12.451277	compliant	89
16	4	8	2026-05-18 05:39:23.648376	failed	admin	Unsupported OS version	\N	2026-05-18 05:39:23.65013	unknown	0
17	4	5	2026-05-18 05:39:23.65013	failed	admin	Network timeout during deployment	\N	2026-05-18 05:39:23.666262	unknown	0
8	3	2	2026-05-08 07:35:01.655553	pending	admin		\N	\N	unknown	0
5	3	3	2026-05-07 05:25:41.077023	pending	admin		\N	\N	unknown	0
31	5	7	2026-05-18 05:39:24.022112	failed	admin	Unsupported OS version	\N	2026-05-18 05:39:24.022112	unknown	0
19	3	6	2026-05-18 05:39:23.698192	success	admin	All rules deployed and verified	2026-05-18 05:39:23.70037	2026-05-18 13:23:12.52318	compliant	100
11	4	2	2026-05-11 10:09:53.22101	success	admin	All rules deployed and verified	2026-05-11 10:09:53.226756	2026-05-18 13:23:12.593896	compliant	89
20	3	7	2026-05-18 05:39:23.713945	success	admin	Policy synced and active	2026-05-18 05:39:23.713945	2026-05-18 13:23:12.657761	compliant	100
7	2	5	2026-05-07 11:05:43.003203	pending	admin		\N	\N	unknown	0
3	2	3	2026-05-05 07:45:44.87096	success	admin		\N	2026-05-18 13:23:10.536174	compliant	84
24	3	11	2026-05-18 05:39:23.809196	success	admin	Policy synced and active	2026-05-18 05:39:23.825131	2026-05-18 13:23:10.605761	compliant	100
10	4	1	2026-05-11 10:09:53.183332	success	admin	All rules deployed and verified	2026-05-11 10:09:53.192997	2026-05-18 13:23:10.689211	warning	79
18	4	11	2026-05-18 05:39:23.671176	success	admin	All rules deployed and verified	2026-05-18 05:39:23.671176	2026-05-18 13:23:10.763552	compliant	89
34	5	2	2026-05-18 05:39:24.100519	success	admin	Policy applied successfully	2026-05-18 05:39:24.1037	2026-05-18 13:23:10.827575	compliant	80
38	5	11	2026-05-18 05:39:24.212841	success	admin	Policy applied successfully	2026-05-18 05:39:24.215263	2026-05-18 13:23:10.895871	compliant	85
6	3	1	2026-05-07 05:25:41.093853	success	admin	Policy applied successfully	2026-05-18 11:46:12.540553	2026-05-18 13:23:10.982729	compliant	88
22	3	4	2026-05-18 05:39:23.766933	success	admin	Policy synced and active	2026-05-18 05:39:23.777324	2026-05-18 13:23:11.046672	compliant	100
23	3	5	2026-05-18 05:39:23.798652	success	admin	Policy synced and active	2026-05-18 05:39:23.800314	2026-05-18 13:23:11.125741	compliant	100
32	5	8	2026-05-18 05:39:24.036362	success	admin	Policy applied successfully	2026-05-18 05:39:24.038389	2026-05-18 13:23:11.201197	compliant	80
37	5	5	2026-05-18 05:39:24.188638	success	admin	Policy applied successfully	2026-05-18 05:39:24.191803	2026-05-18 13:23:11.280724	non_compliant	60
33	5	1	2026-05-18 05:39:24.065165	success	admin	Policy synced and active	2026-05-18 05:39:24.065165	2026-05-18 13:23:11.355388	warning	75
2	2	2	2026-05-05 07:45:44.865964	success	admin		\N	2026-05-18 13:23:11.427036	compliant	100
14	4	6	2026-05-18 05:39:23.570877	success	admin	All rules deployed and verified	2026-05-18 05:39:23.576922	2026-05-18 13:23:11.505639	compliant	84
35	5	3	2026-05-18 05:39:24.134648	success	admin	Policy applied successfully	2026-05-18 05:39:24.134648	2026-05-18 13:23:11.588445	compliant	100
\.


--
-- Data for Name: remediation_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.remediation_actions (id, device_id, alert_id, action_type, performed_by, notes, status, created_at, completed_at) FROM stdin;
1	2	\N	manual_fix	admin		pending	2026-05-16 05:25:48.37604	\N
\.


--
-- Data for Name: security_alerts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_alerts (id, device_id, alert_type, severity, message, status, acknowledged_by, resolved_at, created_at) FROM stdin;
1	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-12 10:57:21.356142
2	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-12 10:57:21.440388
3	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-12 11:26:30.596314
5	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-12 12:01:20.17246
4	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-12 12:01:20.10481
6	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 05:21:24.066257
7	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 05:21:24.201655
8	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 05:21:24.273498
9	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 05:36:24.290052
11	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 05:51:24.217768
13	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 06:21:23.846729
10	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 05:51:24.130294
14	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 06:36:23.787739
12	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 06:21:23.819252
15	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 06:36:23.820638
16	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 06:51:23.77503
17	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 06:51:23.854077
18	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 06:51:24.015411
19	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 07:06:23.833639
20	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 07:06:23.932085
21	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 07:06:23.932085
22	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-13 07:21:23.850016
24	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 08:21:23.797325
23	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 07:36:23.86442
25	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 08:21:23.997408
26	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 08:36:23.877852
27	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 08:36:23.942154
28	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 08:51:23.789343
29	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 08:51:24.010399
31	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 09:21:23.960131
32	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 09:36:23.832277
30	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 09:21:23.872117
33	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 09:36:24.106957
35	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-13 09:51:23.99681
36	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-13 09:51:24.033427
34	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-13 09:51:23.945399
37	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 10:06:24.023031
38	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 10:21:23.785193
39	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 10:21:23.82183
40	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 10:21:23.981636
41	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 10:36:23.918503
42	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 10:51:23.87895
43	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 10:51:23.971079
44	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-13 10:51:24.018342
45	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 10:51:24.161591
46	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 11:06:23.812602
47	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 11:21:23.804907
48	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-13 11:21:23.884698
49	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 11:21:23.884698
50	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 11:21:23.917373
52	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 11:21:23.958105
53	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 11:51:23.776324
51	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-13 11:21:23.917373
54	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-13 11:51:24.047843
55	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 12:06:23.812115
56	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-13 12:06:24.18388
58	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 05:49:14.6705
57	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 05:49:14.597283
59	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 06:04:14.832392
60	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 06:19:14.56139
62	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-14 06:19:14.682464
61	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 06:19:14.621599
63	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 06:49:14.608519
64	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 06:49:14.677765
65	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 06:49:14.747826
66	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-14 06:49:14.797898
67	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 07:04:14.567926
68	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-14 07:04:14.714912
70	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 07:19:14.702203
71	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 07:34:14.776613
72	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 08:34:14.647797
69	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 07:19:14.654588
73	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-14 08:34:14.862125
76	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 08:49:14.846831
75	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 08:49:14.778088
74	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 08:49:14.711369
78	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-14 09:34:14.625323
77	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 09:19:14.648083
79	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 09:49:14.682204
80	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 10:04:14.843825
82	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 10:19:14.759846
81	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 10:19:14.614315
83	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-14 10:34:14.600007
84	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 10:34:14.600007
85	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 10:34:14.769853
86	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 10:34:14.798721
87	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 10:49:14.694148
88	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 10:49:14.741509
90	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 11:04:14.676192
89	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 10:49:14.820122
91	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 11:19:14.672513
92	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 11:19:14.724403
93	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-14 11:34:14.617447
94	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 11:34:14.740703
95	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 11:49:14.721657
96	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 11:49:14.80273
97	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 12:04:14.709641
98	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 12:19:14.735737
99	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-14 12:19:14.812291
101	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 05:04:14.612848
100	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-14 12:19:14.990801
103	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 05:19:14.766525
104	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 05:34:14.576693
105	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 05:34:14.766011
102	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 05:19:14.724166
107	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 05:49:14.652861
106	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 05:49:14.569646
108	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 05:49:14.804956
110	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 06:04:14.708752
109	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 05:49:14.837329
112	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 06:19:14.612457
113	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 06:19:14.64434
114	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 06:19:14.707688
115	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 06:19:14.771699
111	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 06:19:14.580887
117	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 06:49:14.61746
118	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	admin	2026-05-15 07:16:23.628504	2026-05-15 07:04:14.769334
119	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 07:19:14.564115
120	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 07:19:14.597533
116	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	admin	\N	2026-05-15 06:49:14.586625
121	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 07:34:14.565764
122	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 07:34:14.748703
123	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 07:34:14.830616
124	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 08:34:14.602197
125	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 08:34:14.632439
126	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 08:34:14.71174
127	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 08:49:15.096615
129	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:04:15.317321
128	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:04:14.967665
130	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:19:15.088223
131	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 09:19:15.357332
132	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 09:34:14.630934
133	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:34:14.667413
134	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 09:34:14.700514
135	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:34:14.700514
136	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:49:14.725394
137	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:49:14.756203
138	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:49:14.770214
139	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 09:49:14.80412
140	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 10:19:14.69908
142	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 10:19:14.772696
141	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 10:19:14.69908
143	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 10:34:14.733368
144	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 10:34:14.779239
148	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 11:19:14.772987
149	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 11:19:14.873844
147	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 11:19:14.655355
145	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 11:04:14.576052
146	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 11:04:14.576052
150	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 11:49:14.578302
152	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 11:49:14.692823
153	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 12:04:14.740345
154	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 12:19:14.576546
151	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 11:49:14.618555
155	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 12:19:14.670321
156	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-15 12:19:14.670321
157	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 12:19:14.826758
158	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-15 12:19:14.880008
159	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-15 12:19:14.880008
160	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 05:00:05.146732
161	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 05:00:05.334764
164	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 05:15:05.131019
162	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 05:00:05.495031
165	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 05:15:05.255173
163	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 05:15:05.046045
166	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 05:30:05.097267
168	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 05:45:05.006057
167	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 05:30:05.14518
170	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 06:00:05.026657
169	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 05:45:05.042904
171	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 06:15:05.150422
172	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 06:30:05.066596
173	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 06:30:05.279663
174	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 06:45:05.12203
176	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 07:00:05.027951
178	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 07:00:05.133516
177	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 07:00:05.067203
175	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 06:45:05.206676
179	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 07:15:04.981847
180	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 07:15:05.072219
183	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 08:30:05.218587
181	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 08:30:05.020964
184	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 08:48:25.217086
185	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 09:03:25.144612
186	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 09:18:24.973286
182	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 08:30:05.089144
187	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 09:33:24.972425
188	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 09:33:25.025688
189	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 09:48:25.042915
190	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 09:48:25.091037
192	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 10:03:25.168146
191	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 10:03:25.146862
193	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 10:18:25.23242
194	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 10:48:24.982872
195	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 11:03:25.007487
196	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 11:18:25.08939
197	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 11:33:24.938264
199	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 11:33:25.01339
200	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 11:33:25.072334
201	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 11:48:24.945007
198	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 11:33:24.966483
203	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 12:03:25.1634
206	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 12:18:25.145329
207	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-16 12:18:25.186675
204	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 12:18:24.973302
205	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-16 12:18:24.973302
202	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-16 11:48:25.13803
212	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 05:53:11.223153
213	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 05:53:11.361255
214	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 05:53:11.397379
208	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 05:53:10.588179
209	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 05:53:10.642514
210	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 05:53:10.693524
215	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 05:53:11.48892
219	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:08:10.747209
211	7	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 05:53:10.929472
218	8	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:08:10.73288
220	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:08:10.794899
221	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:08:10.858229
222	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 06:08:11.140222
217	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:08:10.565723
216	6	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:08:10.565723
229	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:23:11.281849
224	7	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:23:10.587599
225	7	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:23:10.587599
223	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:08:11.252517
232	5	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 06:38:10.845229
231	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:38:10.697913
238	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:38:11.556747
227	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:23:10.981189
246	11	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 07:08:11.240637
230	11	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:23:11.410382
228	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:23:11.121855
236	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 06:38:11.230973
241	6	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:53:11.185675
244	7	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 07:08:10.940646
245	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 07:08:11.079867
250	8	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 07:08:11.49514
251	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 07:08:11.49514
237	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 06:38:11.336958
252	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 07:23:10.701093
226	6	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 06:23:10.86622
235	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:38:11.200655
233	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:38:10.845229
242	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:53:11.526338
239	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 06:53:10.932456
240	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:53:10.932456
248	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 07:08:11.301246
247	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 07:08:11.301246
243	6	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 07:08:10.627798
249	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 07:08:11.443519
234	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 06:38:10.970749
255	8	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 07:23:11.233463
253	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 07:23:10.906355
260	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:23:11.675964
257	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:23:10.975168
254	7	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 07:23:11.095623
263	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:38:11.108269
265	8	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 08:38:11.230772
258	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:23:11.232401
261	5	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 08:38:10.678892
256	8	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 08:23:10.637569
268	6	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 08:53:11.081115
269	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:53:11.241326
270	7	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:53:11.347474
271	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:53:11.534116
262	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:38:10.873125
266	6	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 08:38:11.467483
264	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:38:11.149065
267	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 08:53:10.910769
273	7	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 09:08:11.454761
259	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 08:23:11.318132
276	6	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 09:08:12.353426
275	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 09:08:12.265525
281	6	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 10:08:12.200006
272	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 09:08:10.614083
279	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:08:10.824854
280	5	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 10:08:11.239421
274	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 09:08:11.620765
285	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:23:11.850631
286	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 10:23:11.976907
287	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:23:12.440219
288	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:23:12.598225
283	6	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 10:23:10.994637
277	11	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 10:08:10.665505
284	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:23:11.700845
291	11	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 10:38:12.029239
289	5	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 10:38:10.756313
292	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:38:12.46031
290	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 10:38:11.197747
282	7	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:23:10.925928
293	11	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 11:08:10.924315
278	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 10:08:10.729737
297	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:08:11.264229
298	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 11:08:11.303592
295	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:08:11.130612
294	2	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:08:10.97549
300	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:08:11.573438
303	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:23:10.931877
305	1	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 11:23:11.075247
306	2	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:23:11.098819
307	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:23:11.320228
304	7	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:23:11.045597
302	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:23:10.794356
310	2	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 11:38:10.902939
308	4	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 11:23:11.475201
301	11	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:23:10.682806
309	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:38:10.705487
312	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:38:11.00612
315	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:38:11.514526
326	4	os_outdated	high	Operating system is outdated and may have known vulnerabilities	open	\N	\N	2026-05-18 12:08:10.829932
316	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:53:10.590878
314	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:38:11.183249
322	5	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:53:11.124693
335	5	encryption_disabled	critical	Storage encryption is disabled — data at risk	open	\N	\N	2026-05-18 13:23:11.343289
330	8	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 12:23:10.998939
320	3	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:53:10.850244
337	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	open	\N	\N	2026-05-18 13:23:12.282237
299	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:08:11.429816
313	8	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:38:11.122589
311	11	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 11:38:10.955341
321	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:53:11.094825
319	7	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:53:10.827239
328	1	os_outdated	high	Operating system is outdated and may have known vulnerabilities	open	\N	\N	2026-05-18 12:23:10.756665
327	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	resolved	\N	\N	2026-05-18 12:08:11.63077
324	1	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 12:08:10.595032
325	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 12:08:10.734079
334	11	os_outdated	high	Operating system is outdated and may have known vulnerabilities	open	\N	\N	2026-05-18 13:23:10.968614
336	3	encryption_disabled	critical	Storage encryption is disabled — data at risk	open	\N	\N	2026-05-18 13:23:12.121871
296	5	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:08:11.171285
323	8	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:53:11.158675
317	6	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 11:53:10.638426
318	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	resolved	\N	\N	2026-05-18 11:53:10.638426
331	6	os_outdated	high	Operating system is outdated and may have known vulnerabilities	open	\N	\N	2026-05-18 12:23:11.35225
332	7	encryption_disabled	critical	Storage encryption is disabled — data at risk	open	\N	\N	2026-05-18 12:23:11.473149
333	3	no_screen_lock	high	Screen lock / PIN is not enabled on this device	open	\N	\N	2026-05-18 13:23:10.589968
329	4	encryption_disabled	critical	Storage encryption is disabled — data at risk	resolved	\N	\N	2026-05-18 12:23:10.942341
\.


--
-- Data for Name: ticket_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_comments (id, ticket_id, comment, created_by, created_at) FROM stdin;
1	1	RESOLVED	admin	2026-05-08 09:25:18.577525
2	3	Ticket has been assigned 	admin	2026-05-09 08:18:30.486732
3	14	string	string	2026-05-14 11:47:47.827964
\.


--
-- Data for Name: ticket_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_history (id, ticket_id, ticket_number, changed_by, field_name, old_value, new_value, changed_at) FROM stdin;
1	13	TKT-00013	system	status	assigned	resolved	2026-05-18 07:23:51.773125
2	13	TKT-00013	system	status	resolved	closed	2026-05-18 07:23:51.773125
3	11	TKT-00011	system	status	assigned	resolved	2026-05-18 07:23:51.794575
4	11	TKT-00011	system	status	resolved	closed	2026-05-18 07:23:51.794575
5	18	TKT-00018	system	status	assigned	in_progress	2026-05-18 07:24:17.67062
6	18	TKT-00018	system	status	in_progress	resolved	2026-05-18 07:24:18.289872
7	18	TKT-00018	system	status	resolved	closed	2026-05-18 07:24:21.466127
8	14	TKT-00014	system	status	resolved	closed	2026-05-18 07:27:01.661596
9	10	TKT-00010	system	status	assigned	in_progress	2026-05-18 12:19:14.885568
10	9	TKT-00009	system	status	assigned	in_progress	2026-05-18 12:19:14.902018
11	10	TKT-00010	system	assigned_to	bob@risktrix.com	john	2026-05-18 12:20:45.480049
12	9	TKT-00009	system	assigned_to	alice@risktrix.com	john	2026-05-18 12:20:45.486052
13	8	TKT-00008	system	assigned_to	bob@risktrix.com	john	2026-05-18 12:20:45.489895
14	17	TKT-00017	system	status	assigned	resolved	2026-05-18 12:21:30.491276
15	17	TKT-00017	system	status	resolved	closed	2026-05-18 12:21:30.491276
16	16	TKT-00016	system	status	resolved	closed	2026-05-18 12:21:30.513065
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (id, ticket_number, title, description, status, priority, impact, urgency, category, assignment_group, assigned_to, created_by, created_at, updated_at, resolved_at, closed_at, resolution_code, resolution_notes, resolved_by, caller, channel, subcategory, sla_response_due, sla_resolution_due, sla_response_breached, sla_resolution_breached, sla_response_met_at, caller_email, asset_id, parent_id) FROM stdin;
7	TKT-00007	Critical server breach		closed	critical	high	high	security	security	alice@risktrix.com	admin	2026-05-13 09:33:37.31234	2026-05-15 12:06:31.318365	\N	2026-05-15 12:06:31.318365					self-service		2026-05-13 10:33:37.31234	2026-05-13 13:33:37.31234	f	t	\N		\N	\N
1	TKT-00001	Login page not working	Users cannot login from Chrome browser	closed	critical	high	high	software			admin	2026-05-08 09:07:17.142008	2026-05-08 09:35:07.772081	\N	2026-05-08 09:35:07.772081					self-service		\N	\N	f	f	\N		\N	\N
2	TKT-00002	Urgent resolution needed		resolved	critical	high	high	security	Cyber Security	John	Sakshi	2026-05-08 09:41:16.423648	2026-05-09 05:50:38.895054	\N	\N					self-service		\N	\N	f	f	\N		\N	\N
15	TKT-00015	string		assigned	low	low	low	general	general	mia@risktrix.com	string	2026-05-14 11:35:04.919559	2026-05-18 05:25:02.308322	\N	\N					self-service		2026-05-15 11:35:00.693995	2026-05-17 11:35:00.693995	t	t	\N		\N	\N
13	TKT-00013	string		closed	low	low	low	general	general	mia@risktrix.com	string	2026-05-14 11:27:34.202055	2026-05-18 07:23:51.773125	2026-05-18 07:23:51.773125	2026-05-18 07:23:51.773125	bulk_close	Bulk closed	system		self-service		2026-05-15 11:27:29.958216	2026-05-17 11:27:29.958216	t	t	\N		\N	\N
11	TKT-00011	Critical auth issue22		closed	critical	high	high	security	security	alice@risktrix.com	admin	2026-05-13 09:51:27.603686	2026-05-18 07:23:51.794575	2026-05-18 07:23:51.793564	2026-05-18 07:23:51.794575	bulk_close	Bulk closed	system		self-service		2026-05-13 10:51:27.592056	2026-05-13 13:51:27.592056	t	t	\N		\N	\N
5	TKT-00005	Server down		closed	critical	high	high	security	security	alice@risktrix.com	admin	2026-05-13 08:47:35.776729	2026-05-14 07:28:14.87729	\N	2026-05-14 07:28:14.87729					self-service		2026-05-13 09:47:35.766663	2026-05-13 12:47:35.766663	f	t	\N		\N	\N
4	TKT-00004	Issue in security 		resolved	medium	medium	medium	security	Cyber Security Team	John	admin	2026-05-09 09:43:20.802236	2026-05-14 07:28:41.28821	\N	\N				Sakshi	phone	Unauthorized Access	2026-05-09 17:43:20.786166	2026-05-11 09:43:20.786166	f	f	2026-05-09 09:44:02.676683		\N	\N
18	TKT-00018	VPN Access Issue	Unable to connect to VPN	closed	critical	high	high	network	it-ops	eve@risktrix.com	admin	2026-05-16 06:22:18.170894	2026-05-18 07:24:21.466127	\N	2026-05-18 07:24:21.466127				john@risktrix.com	email	VPN	2026-05-16 07:22:13.918868	2026-05-16 10:22:13.918868	t	t	\N		\N	\N
3	TKT-00003	Cart is not adding items		in_progress	high	medium	high	software	IT		admin	2026-05-09 06:37:46.557511	2026-05-16 08:41:52.55362	\N	\N				Sakshi	email	Performance	2026-05-09 10:37:46.550161	2026-05-10 06:37:46.550161	f	t	2026-05-09 07:20:45.067959		\N	\N
6	TKT-00006	Server down		assigned	critical	high	high	security	security	bob@risktrix.com	admin	2026-05-13 08:47:37.25876	2026-05-16 08:41:52.55362	\N	\N					self-service		2026-05-13 09:47:37.257241	2026-05-13 12:47:37.257241	t	t	\N		\N	\N
12	TKT-00012	fgjgjgfsg		assigned	low	low	low	general	general	leo@risktrix.com	admin	2026-05-14 07:33:01.445919	2026-05-18 05:25:02.308322	\N	\N				hgfjghjjjhg	self-service	General Inquiry	2026-05-15 07:32:57.089131	2026-05-17 07:32:57.089131	t	t	\N		\N	\N
14	TKT-00014	string	string	closed	low	string	string	string	string	string	string	2026-05-14 11:28:18.412957	2026-05-18 07:27:01.661596	2026-05-14 11:47:31.620783	2026-05-18 07:27:01.661596	string	string	string	string	string	string	2026-05-15 11:28:18.412957	2026-05-17 11:28:18.412957	f	t	\N		\N	\N
10	TKT-00010	auth issue2		in_progress	critical	high	high	security	security	john	admin	2026-05-13 09:48:37.573123	2026-05-18 12:20:45.480049	\N	\N					self-service		2026-05-13 10:48:37.570402	2026-05-13 13:48:37.570402	t	t	\N		\N	\N
9	TKT-00009	auth issue		in_progress	high	medium	high	security	security	john	admin	2026-05-13 09:45:59.251071	2026-05-18 12:20:45.486052	\N	\N					self-service		2026-05-13 13:45:59.236455	2026-05-14 09:45:59.236455	t	t	\N		\N	\N
8	TKT-00008	Critical server issue		assigned	high	medium	high	security	security	john	admin	2026-05-13 09:40:15.367656	2026-05-18 12:20:45.488811	\N	\N					self-service		2026-05-13 13:40:15.367656	2026-05-14 09:40:15.367656	t	t	\N		\N	\N
17	TKT-00017	 bnbdgngf		closed	low	low	low	security	security	alice@risktrix.com	admin	2026-05-15 11:19:22.513546	2026-05-18 12:21:30.491276	2026-05-18 12:21:30.491276	2026-05-18 12:21:30.491276	bulk_close	Bulk closed	system	Security issues	chat	Malware	2026-05-16 11:19:18.18374	2026-05-18 11:19:18.18374	t	t	\N		\N	\N
16	TKT-00016	string		closed	low	low	low	general	general	leo@risktrix.com	string	2026-05-14 11:44:37.629619	2026-05-18 12:21:30.513065	2026-05-15 07:15:43.910201	2026-05-18 12:21:30.513065	Work around	swdqw	leo		self-service		2026-05-15 11:44:33.429053	2026-05-17 11:44:33.429053	f	f	\N		\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, full_name, hashed_password, is_active, is_superuser, role, last_login, phone, department, profile_type, company, privilege_level, clearance_level, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vendors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vendors (id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vulnerabilities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vulnerabilities (id, title, description, cve_id, severity, status, discovered_date, source, cvss_score, cvss_vector, exploit_available, remediation_plan, remediation_deadline, remediation_completed, remarks, impact, poc_file_path, application_id, vendor_id, assigned_to_id, created_at, updated_at) FROM stdin;
\.


--
-- Name: agent_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_availability_id_seq', 5, true);


--
-- Name: agent_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_metrics_id_seq', 1, false);


--
-- Name: agent_oncall_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_oncall_id_seq', 9, true);


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.applications_id_seq', 1, true);


--
-- Name: asset_changelog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asset_changelog_id_seq', 1, false);


--
-- Name: asset_software_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asset_software_id_seq', 1, false);


--
-- Name: asset_vulnerabilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asset_vulnerabilities_id_seq', 1, false);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 40, true);


--
-- Name: assignment_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assignment_logs_id_seq', 1, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 4, true);


--
-- Name: automation_executions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.automation_executions_id_seq', 1, false);


--
-- Name: automation_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.automation_rules_id_seq', 1, true);


--
-- Name: compliance_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_results_id_seq', 11342, true);


--
-- Name: compliance_violations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.compliance_violations_id_seq', 1384, true);


--
-- Name: device_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_activities_id_seq', 40, true);


--
-- Name: device_checkins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_checkins_id_seq', 1, false);


--
-- Name: device_commands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_commands_id_seq', 9, true);


--
-- Name: device_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_enrollments_id_seq', 3, true);


--
-- Name: device_group_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_group_members_id_seq', 1, false);


--
-- Name: device_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_groups_id_seq', 1, true);


--
-- Name: device_security_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.device_security_profiles_id_seq', 9, true);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.devices_id_seq', 11, true);


--
-- Name: directory_agents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.directory_agents_id_seq', 5, true);


--
-- Name: enrollment_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.enrollment_tokens_id_seq', 3, true);


--
-- Name: eosl_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.eosl_records_id_seq', 1, false);


--
-- Name: group_policy_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_policy_assignments_id_seq', 1, false);


--
-- Name: organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.organizations_id_seq', 1, false);


--
-- Name: outbox_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.outbox_events_id_seq', 32, true);


--
-- Name: policies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.policies_id_seq', 5, true);


--
-- Name: policy_device_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.policy_device_assignments_id_seq', 38, true);


--
-- Name: remediation_actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.remediation_actions_id_seq', 1, true);


--
-- Name: security_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.security_alerts_id_seq', 337, true);


--
-- Name: ticket_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ticket_comments_id_seq', 3, true);


--
-- Name: ticket_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ticket_history_id_seq', 16, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tickets_id_seq', 18, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: vendors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vendors_id_seq', 1, false);


--
-- Name: vulnerabilities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vulnerabilities_id_seq', 1, false);


--
-- Name: agent_availability agent_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_availability
    ADD CONSTRAINT agent_availability_pkey PRIMARY KEY (id);


--
-- Name: agent_metrics agent_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_metrics
    ADD CONSTRAINT agent_metrics_pkey PRIMARY KEY (id);


--
-- Name: agent_oncall agent_oncall_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_oncall
    ADD CONSTRAINT agent_oncall_pkey PRIMARY KEY (id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: asset_changelog asset_changelog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_changelog
    ADD CONSTRAINT asset_changelog_pkey PRIMARY KEY (id);


--
-- Name: asset_software asset_software_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_software
    ADD CONSTRAINT asset_software_pkey PRIMARY KEY (id);


--
-- Name: asset_vulnerabilities asset_vulnerabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_vulnerabilities
    ADD CONSTRAINT asset_vulnerabilities_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: assignment_logs assignment_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_logs
    ADD CONSTRAINT assignment_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: automation_executions automation_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_executions
    ADD CONSTRAINT automation_executions_pkey PRIMARY KEY (id);


--
-- Name: automation_rules automation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automation_rules
    ADD CONSTRAINT automation_rules_pkey PRIMARY KEY (id);


--
-- Name: compliance_results compliance_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_results
    ADD CONSTRAINT compliance_results_pkey PRIMARY KEY (id);


--
-- Name: compliance_violations compliance_violations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_violations
    ADD CONSTRAINT compliance_violations_pkey PRIMARY KEY (id);


--
-- Name: device_activities device_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_activities
    ADD CONSTRAINT device_activities_pkey PRIMARY KEY (id);


--
-- Name: device_checkins device_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_checkins
    ADD CONSTRAINT device_checkins_pkey PRIMARY KEY (id);


--
-- Name: device_commands device_commands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_commands
    ADD CONSTRAINT device_commands_pkey PRIMARY KEY (id);


--
-- Name: device_enrollments device_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_enrollments
    ADD CONSTRAINT device_enrollments_pkey PRIMARY KEY (id);


--
-- Name: device_group_members device_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_group_members
    ADD CONSTRAINT device_group_members_pkey PRIMARY KEY (id);


--
-- Name: device_groups device_groups_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_groups
    ADD CONSTRAINT device_groups_name_key UNIQUE (name);


--
-- Name: device_groups device_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_groups
    ADD CONSTRAINT device_groups_pkey PRIMARY KEY (id);


--
-- Name: device_security_profiles device_security_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_security_profiles
    ADD CONSTRAINT device_security_profiles_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: directory_agents directory_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.directory_agents
    ADD CONSTRAINT directory_agents_pkey PRIMARY KEY (id);


--
-- Name: enrollment_tokens enrollment_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollment_tokens
    ADD CONSTRAINT enrollment_tokens_pkey PRIMARY KEY (id);


--
-- Name: enrollment_tokens enrollment_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollment_tokens
    ADD CONSTRAINT enrollment_tokens_token_key UNIQUE (token);


--
-- Name: eosl_records eosl_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eosl_records
    ADD CONSTRAINT eosl_records_pkey PRIMARY KEY (id);


--
-- Name: group_policy_assignments group_policy_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_policy_assignments
    ADD CONSTRAINT group_policy_assignments_pkey PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: policies policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policies
    ADD CONSTRAINT policies_pkey PRIMARY KEY (id);


--
-- Name: policy_device_assignments policy_device_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_device_assignments
    ADD CONSTRAINT policy_device_assignments_pkey PRIMARY KEY (id);


--
-- Name: policy_device_assignments policy_device_assignments_policy_id_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.policy_device_assignments
    ADD CONSTRAINT policy_device_assignments_policy_id_device_id_key UNIQUE (policy_id, device_id);


--
-- Name: remediation_actions remediation_actions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remediation_actions
    ADD CONSTRAINT remediation_actions_pkey PRIMARY KEY (id);


--
-- Name: security_alerts security_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_alerts
    ADD CONSTRAINT security_alerts_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: ticket_history ticket_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT ticket_history_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_number_key UNIQUE (ticket_number);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vendors vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);


--
-- Name: vulnerabilities vulnerabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vulnerabilities
    ADD CONSTRAINT vulnerabilities_pkey PRIMARY KEY (id);


--
-- Name: ix_agent_availability_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_agent_availability_agent_id ON public.agent_availability USING btree (agent_id);


--
-- Name: ix_agent_availability_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_agent_availability_id ON public.agent_availability USING btree (id);


--
-- Name: ix_agent_metrics_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_agent_metrics_agent_id ON public.agent_metrics USING btree (agent_id);


--
-- Name: ix_agent_metrics_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_agent_metrics_id ON public.agent_metrics USING btree (id);


--
-- Name: ix_agent_metrics_recorded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_agent_metrics_recorded_at ON public.agent_metrics USING btree (recorded_at);


--
-- Name: ix_agent_oncall_agent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_agent_oncall_agent_id ON public.agent_oncall USING btree (agent_id);


--
-- Name: ix_agent_oncall_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_agent_oncall_id ON public.agent_oncall USING btree (id);


--
-- Name: ix_applications_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_applications_id ON public.applications USING btree (id);


--
-- Name: ix_applications_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_applications_name ON public.applications USING btree (name);


--
-- Name: ix_assets_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_assets_id ON public.assets USING btree (id);


--
-- Name: ix_automation_executions_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_automation_executions_device_id ON public.automation_executions USING btree (device_id);


--
-- Name: ix_automation_executions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_automation_executions_id ON public.automation_executions USING btree (id);


--
-- Name: ix_automation_executions_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_automation_executions_rule_id ON public.automation_executions USING btree (rule_id);


--
-- Name: ix_automation_rules_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_automation_rules_id ON public.automation_rules USING btree (id);


--
-- Name: ix_compliance_results_assignment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_compliance_results_assignment_id ON public.compliance_results USING btree (assignment_id);


--
-- Name: ix_compliance_results_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_compliance_results_device_id ON public.compliance_results USING btree (device_id);


--
-- Name: ix_compliance_results_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_compliance_results_id ON public.compliance_results USING btree (id);


--
-- Name: ix_compliance_results_policy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_compliance_results_policy_id ON public.compliance_results USING btree (policy_id);


--
-- Name: ix_device_commands_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_device_commands_device_id ON public.device_commands USING btree (device_id);


--
-- Name: ix_device_commands_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_device_commands_id ON public.device_commands USING btree (id);


--
-- Name: ix_device_group_members_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_device_group_members_device_id ON public.device_group_members USING btree (device_id);


--
-- Name: ix_device_group_members_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_device_group_members_group_id ON public.device_group_members USING btree (group_id);


--
-- Name: ix_device_group_members_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_device_group_members_id ON public.device_group_members USING btree (id);


--
-- Name: ix_device_groups_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_device_groups_id ON public.device_groups USING btree (id);


--
-- Name: ix_device_security_profiles_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_device_security_profiles_device_id ON public.device_security_profiles USING btree (device_id);


--
-- Name: ix_device_security_profiles_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_device_security_profiles_id ON public.device_security_profiles USING btree (id);


--
-- Name: ix_directory_agents_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_directory_agents_email ON public.directory_agents USING btree (email);


--
-- Name: ix_directory_agents_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_directory_agents_id ON public.directory_agents USING btree (id);


--
-- Name: ix_eosl_records_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_eosl_records_id ON public.eosl_records USING btree (id);


--
-- Name: ix_eosl_records_product_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_eosl_records_product_name ON public.eosl_records USING btree (product_name);


--
-- Name: ix_group_policy_assignments_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_group_policy_assignments_group_id ON public.group_policy_assignments USING btree (group_id);


--
-- Name: ix_group_policy_assignments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_group_policy_assignments_id ON public.group_policy_assignments USING btree (id);


--
-- Name: ix_group_policy_assignments_policy_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_group_policy_assignments_policy_id ON public.group_policy_assignments USING btree (policy_id);


--
-- Name: ix_organizations_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_organizations_id ON public.organizations USING btree (id);


--
-- Name: ix_outbox_events_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_outbox_events_id ON public.outbox_events USING btree (id);


--
-- Name: ix_policies_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_policies_id ON public.policies USING btree (id);


--
-- Name: ix_remediation_actions_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_remediation_actions_device_id ON public.remediation_actions USING btree (device_id);


--
-- Name: ix_remediation_actions_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_remediation_actions_id ON public.remediation_actions USING btree (id);


--
-- Name: ix_security_alerts_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_security_alerts_device_id ON public.security_alerts USING btree (device_id);


--
-- Name: ix_security_alerts_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_security_alerts_id ON public.security_alerts USING btree (id);


--
-- Name: ix_ticket_comments_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_comments_id ON public.ticket_comments USING btree (id);


--
-- Name: ix_ticket_history_changed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_history_changed_at ON public.ticket_history USING btree (changed_at);


--
-- Name: ix_ticket_history_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_history_id ON public.ticket_history USING btree (id);


--
-- Name: ix_ticket_history_ticket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_history_ticket_id ON public.ticket_history USING btree (ticket_id);


--
-- Name: ix_ticket_history_ticket_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ticket_history_ticket_number ON public.ticket_history USING btree (ticket_number);


--
-- Name: ix_tickets_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_tickets_id ON public.tickets USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: ix_vendors_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vendors_id ON public.vendors USING btree (id);


--
-- Name: ix_vulnerabilities_cve_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vulnerabilities_cve_id ON public.vulnerabilities USING btree (cve_id);


--
-- Name: ix_vulnerabilities_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vulnerabilities_id ON public.vulnerabilities USING btree (id);


--
-- Name: ix_vulnerabilities_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vulnerabilities_status ON public.vulnerabilities USING btree (status);


--
-- Name: ix_vulnerabilities_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_vulnerabilities_title ON public.vulnerabilities USING btree (title);


--
-- Name: agent_availability agent_availability_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_availability
    ADD CONSTRAINT agent_availability_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.directory_agents(id);


--
-- Name: agent_metrics agent_metrics_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_metrics
    ADD CONSTRAINT agent_metrics_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.directory_agents(id);


--
-- Name: agent_oncall agent_oncall_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_oncall
    ADD CONSTRAINT agent_oncall_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.directory_agents(id);


--
-- Name: applications applications_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: applications applications_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: asset_changelog asset_changelog_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_changelog
    ADD CONSTRAINT asset_changelog_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: asset_software asset_software_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_software
    ADD CONSTRAINT asset_software_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: asset_vulnerabilities asset_vulnerabilities_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asset_vulnerabilities
    ADD CONSTRAINT asset_vulnerabilities_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;


--
-- Name: eosl_records eosl_records_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eosl_records
    ADD CONSTRAINT eosl_records_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id);


--
-- Name: eosl_records eosl_records_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eosl_records
    ADD CONSTRAINT eosl_records_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: ticket_history ticket_history_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_history
    ADD CONSTRAINT ticket_history_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id);


--
-- Name: tickets tickets_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.tickets(id);


--
-- Name: vulnerabilities vulnerabilities_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vulnerabilities
    ADD CONSTRAINT vulnerabilities_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id);


--
-- Name: vulnerabilities vulnerabilities_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vulnerabilities
    ADD CONSTRAINT vulnerabilities_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: vulnerabilities vulnerabilities_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vulnerabilities
    ADD CONSTRAINT vulnerabilities_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6clOaYs8a9pj6awBZj6opiYP5bBuGw8qZLxNaEnzCyXlaelhM8cx4OLeBrTYHya

