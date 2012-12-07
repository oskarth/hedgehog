(ns hedgehog.macros
  (:use [reflex.macros :only [computed-observable]])
  (:require [clojure.walk :as walk]))

(defmacro defo
  "defines observable"
  [name body]
  `(def ~name (atom ~body)))

(defmacro defco
  "defined computed observables"
  [name expr]
  `(def ~name (computed-observable ~expr)))

    
(defmacro defbody
  [name body]
  (let [[body-code event-map] (bind-body body)]
    `(do
       (defco ~name ~body-code)
       (reset! hedgehog.core/!event-map ~event-map))))