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

(defmacro defbody [name body]
;;  (let [body# (quote body)]
  `(defco ~name (hedgehog.core/walk-body ~body)))