(ns hedgehog.todos
  (:require [hedgehog.core :as hedgehog]))

(def state (atom
  {:todos ["buy milk" "eat lunch" "drink milk"]
   :pending-todo "foo bar"}))

(defn add-todo [todo]
  (swap! state update-in [:todos] conj todo))

(defn todo-element [todo]
  [:li.todo todo])

(defn todos [state]
  [:div#todos
    [:ul (map todo-element (:todos state))]
    [:input
      {:value (:pending-todo state)
       :type "text"}]
    [:button "Add" (comment {:mouse-event add-todo})]])

(hedgehog/init todos state)