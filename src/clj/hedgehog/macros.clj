(ns hedgehog.macros
  (:use [reflex.macros :only [computed-observable]])
  (:require [clojure.walk :as walk]))

;; Taken from Hiccup: http://git.io/65Rf3g
(def re-tag #"([^\s\.#]+)(?:#([^\s\.#]+))?(?:\.([^\s#]+))?")

(defmacro defo
  "defines observable"
  [name body]
  `(def ~name (atom ~body)))

(defmacro defco
  "defined computed observables"
  [name expr]
  `(def ~name (computed-observable ~expr)))

(defn- eval-to-map? [form]
  (and (fn? form) (map? (form))))

(defn- elem-with-attr? [form]
  (and (vector? form)
       (keyword? (first form))
       (or (map? (second form))
           ;; TODO: make this work
           (eval-to-map? (second form)))))

(defn- bind-val? [form]
  (and (elem-with-attr? form)
       (symbol? (:bind-value (second form)))))

(defn- tag-id [[tag & _]]
  "returns tag id or nil of form"
  (nth (re-matches re-tag (name tag)) 2))
  
(defn- bind-value!
  "updates event-map with a unique id and fn,
   and returns the form with updated attribute map"
  [!event-map !id form]
  (let [id (or (tag-id form)
               (:id (second form))
               (swap! !id inc))
        kwid (keyword (str id))
        fn (:bind-value (second form))]
    ;; update event-map
    (swap! !event-map assoc kwid fn)
    ;; insert id into attr map in form
    (assoc-in form [1 :id] id)))

(defn bind-body [form]
  (let [!id (atom -1)
        !event-map (atom {})
        updated-body (walk/postwalk
                      (fn [f]
                        (if (bind-val? f)
                          (bind-value! !event-map !id f)
                          f)) form)]
    [updated-body @!event-map]))
    
(defmacro defbody
  [name body]
  (let [[body-code event-map] (bind-body body)]
    `(do
       (defco ~name ~body-code)
       (reset! hedgehog.core/!event-map ~event-map))))