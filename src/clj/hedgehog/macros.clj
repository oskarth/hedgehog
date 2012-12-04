(ns hedgehog.macros
  (:use [reflex.macros :only [computed-observable]]))

(defmacro defo
  "defines observable"
  [name body]
  `(def ~name (atom ~body)))

(defmacro defco
  "defined computed observables"
  [name expr]
  `(def ~name (computed-observable ~expr)))
