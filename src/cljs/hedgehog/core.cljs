(ns hedgehog.core
  (:require [clojure.browser.event :as event]
            [clojure.browser.dom :as dom]
            [crate.core :as crate]))

;; lib

(defn render [template new-val]
  (dom/replace-node
    (dom/get-element "content")
    (crate/html
      [:div#content
        (template new-val)])))

(defn init [template state]
  (dom/append
    js/document.body
    (dom/element :div {:id "content"}))
  (add-watch state nil
    (fn [k a old-val new-val]
      (render template new-val)))
  (render template @state))

;; todos

(def state (atom
  {:todos ["buy milk" "eat lunch" "drink milk"]}))

(defn add-todo [todo]
  (swap! state update-in [:todos] conj todo))

(defn todo-element [todo]
  [:li.todo todo])

(defn todos [state]
  [:ul (map todo-element (:todos state))])

(init todos state)