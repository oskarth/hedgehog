(ns hedgehog.main
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))

(defn log [& args]
  (.log js/console (apply pr-str args)))

;; state
(def todos (atom ["buy milk" "eat lunch" "drink milk"]))

(defn todo-element [todo]
  [:li.todo todo])

(defn render [todos]
  (crate/html
   ;; TODO: unwrap seq a la crate html (inline-seq fn?)
   [:body
    (apply (partial conj [:ul#todos])
              (map todo-element todos))]))

(add-watch todos nil (fn [key a old-val new-val]
                       (render new-val)))
(render @todos)

(swap! todos conj "foo")

(dom/append (.-body js/document) (render @todos))