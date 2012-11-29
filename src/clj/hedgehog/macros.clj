(ns hedgehog.macros
  (:use [reflex.macros :only [computed-observable]]))

(defmacro defo
  "defines observable"
  [name body]
  `(def ~name (atom ~body)))

(defmacro defco
  "defined computed observables"
  [name expr]
  `(let [co# (computed-observable ~expr)]
     `(def ~name co#)))