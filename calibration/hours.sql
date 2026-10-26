-- HomePlan · hours calibration, computed INSIDE ArreglaTodo's database.
--
-- Runs read-only against ArreglaTodo's production database and returns ONE
-- JSON value: aggregate hour statistics per home profile, plus an honest
-- held-out evaluation. No row, text, id, name, phone or address ever leaves
-- the database: only medians and counts of groups with at least :k jobs.
-- See docs/DATA-POLICY.md.
--
-- Features (from the request text, or the chosen quote for the hours):
--   hours     hours of the cleaning visit (2–12; anything else is noise)
--   bedrooms  "N dormitorios/cuartos/habitaciones", else "N ambientes" − 1
--   bathrooms "N baños"
--   products  con / sin / unknown;  vacuum  true when asked for
-- Evaluation: 1 in 5 jobs (by a hash of the id) is held out; the table is fitted on the
-- rest and scored on them, against a "global median" baseline.

with params as (select 20 as k),
num(w, n) as (values ('un',1),('una',1),('uno',1),('dos',2),('tres',3),('cuatro',4),
                     ('cinco',5),('seis',6),('siete',7),('ocho',8)),
limp as (
  select sr.id, lower(coalesce(sr.description, '')) d
  from service_request sr join service_type st on st.id = sr.service_type_id
  where st.name ilike '%limpieza%' and not coalesce(sr.is_test, false)
),
q as (  -- the quote that carries hours: accepted/selected first, then latest
  select distinct on (q.service_request_id) q.service_request_id id, lower(q.description) qd
  from quotes q join limp on limp.id = q.service_request_id
  where q.description ~* '\d+\s*(h|hs|hrs|horas?)\y'
  order by q.service_request_id, (q.status in ('accepted', 'selected')) desc, q.created_at desc
),
raw as (
  select limp.id, d, coalesce(qd, d) t,
    replace((regexp_match(coalesce(qd, d), '(\d+(?:[.,]5)?)\s*(?:h|hs|hrs|horas?)\y'))[1], ',', '.') hrs,
    (regexp_match(d, '(\d+|un|una|uno|dos|tres|cuatro|cinco|seis)\s*(?:dormitorios?|cuartos?|habitaciones?)'))[1] dorm,
    (regexp_match(d, '(\d+|un|una|uno|dos|tres|cuatro)\s*baños?'))[1] banos,
    (regexp_match(d, '(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho)\s*ambientes?'))[1] amb
  from limp left join q using (id)
),
feat as (
  select id,
    hrs::numeric hours,
    coalesce((select n from num where w = dorm), dorm::int,
             greatest(coalesce((select n from num where w = amb), amb::int) - 1, 0)) bedrooms,
    coalesce((select n from num where w = banos), banos::int) bathrooms,
    case when t ~ 'sin productos' then 'sin'
         when t ~ 'con productos|\+ ?productos|productos incluidos' then 'con'
         else 'unknown' end products,
    (t ~ 'aspiradora' and t !~ '(sin|ni) aspiradora') vacuum,
    (('x' || substr(md5(id::text), 1, 4))::bit(16)::int % 5 = 0) holdout
  from raw
  where hrs is not null and (dorm is not null or amb is not null)
),
clean as (
  select *,
    case when bedrooms >= 4 then '4+' else bedrooms::text end bed_b,
    case when bathrooms is null then 'unknown' when bathrooms >= 2 then '2+' else '1' end bath_b
  from feat where hours between 2 and 12 and bedrooms between 0 and 10
),
-- Level 2: bedrooms × bathrooms × products. Level 1: bedrooms. Level 0: all.
cell2 as (
  select bed_b, bath_b, products, count(*) n,
         percentile_cont(0.5) within group (order by hours) med,
         percentile_cont(0.25) within group (order by hours) p25,
         percentile_cont(0.75) within group (order by hours) p75
  from clean where not holdout group by 1, 2, 3
),
cell1 as (
  select bed_b, count(*) n,
         percentile_cont(0.5) within group (order by hours) med,
         percentile_cont(0.25) within group (order by hours) p25,
         percentile_cont(0.75) within group (order by hours) p75
  from clean where not holdout group by 1
),
cell0 as (
  select count(*) n, percentile_cont(0.5) within group (order by hours) med
  from clean where not holdout
),
scored as (
  select c.hours,
    coalesce(
      (select med from cell2 x where x.bed_b = c.bed_b and x.bath_b = c.bath_b and x.products = c.products and x.n >= (select k from params)),
      (select med from cell1 x where x.bed_b = c.bed_b and x.n >= (select k from params)),
      (select med from cell0)) pred,
    (select med from cell0) base
  from clean c where holdout
)
select jsonb_build_object(
  'version', to_char(now() at time zone 'America/Montevideo', 'YYYY-MM-DD"T"HH24:MI'),
  'min_group', (select k from params),
  'unit', 'hours per visit',
  'by_profile', (select coalesce(jsonb_agg(jsonb_build_object('bedrooms', bed_b, 'bathrooms', bath_b, 'products', products,
                   'median', med, 'p25', p25, 'p75', p75, 'n', n) order by bed_b, bath_b, products), '[]')
                 from cell2 where n >= (select k from params)),
  'by_bedrooms', (select coalesce(jsonb_agg(jsonb_build_object('bedrooms', bed_b,
                   'median', med, 'p25', p25, 'p75', p75, 'n', n) order by bed_b), '[]')
                  from cell1 where n >= (select k from params)),
  'global_median', (select med from cell0),
  'vacuum_share', (select round(avg(vacuum::int)::numeric, 3) from clean),
  'evaluation', jsonb_build_object(
    'train_n', (select n from cell0),
    'test_n', (select count(*) from scored),
    'mae_hours', (select round(avg(abs(hours - pred))::numeric, 2) from scored),
    'baseline_mae_hours', (select round(avg(abs(hours - base))::numeric, 2) from scored),
    'within_1h', (select round(avg((abs(hours - pred) <= 1)::int)::numeric, 3) from scored)
  )
) calibration;
